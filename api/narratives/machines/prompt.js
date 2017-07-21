import { nlp } from '../../services/nlp';
import { getPrompt, savePromptResponses } from '../../prompts/helpers';
import { KnowledgeContact } from '../../knowledge-base/models';
import EmailService from '../../services/email';
import * as PROMPT_CONSTANTS from '../../constants/prompts';
import * as replyTemplates from '../templates/quick-replies';
import { createTask } from '../../tasks/helpers';
import { createLocation } from '../../knowledge-base/helpers';

export default {
  loading_prompt: {
    enter() {
      const label = this.snapshot.nlp.entities ?
        this.snapshot.nlp.entities.intent[0].value : null;
      if (!label) return this.getBaseState();
      return getPrompt({ label }).then((prompt) => {
        if (!prompt) return this.getBaseState();
        this.set('prompt', prompt);
        return 'waiting_for_answer';
      });
    },
  },

  waiting_for_acceptance: {
    enter(aux = {}) {
      return this.messagingClient.send(aux.message || `I can help you with ${`"${this.get('prompt').name}"` || 'this'}, but I need to ask a few questions. Is that ok?`, replyTemplates.sureNoThanks);
    },
    message() {
      return nlp.message(this.snapshot.input.payload.text).then((nlpData) => {
        this.snapshot.nlp = nlpData;
        const entities = nlpData.entities;
        if (entities.intent && entities.intent[0]) {
          if (entities.intent.filter(i => i.value === 'speech.confirm').length > 0) {
            return this.messagingClient.send('Great! :)').then(() => 'waiting_for_answer');
          }
          if (entities.intent.filter(i => i.value === 'speech.deny').length > 0) {
            this.delete('prompt');
            return this.messagingClient.send('Ok! No problem.').then(() => this.getBaseState());
          }
        }
        return this.messagingClient.send('Sorry, didn\'t catch that. Can I ask you a few quick questions?', replyTemplates.sureNoThanks);
      });
    },
  },

  waiting_for_answer: {
    enter() {
      if (!this.snapshot.data_store.prompt) return this.getBaseState();
      const steps = this.snapshot.data_store.prompt.steps;
      if (!steps) {
        this.delete('prompt');
        return this.getBaseState();
      }
      for (let i = 0; i < steps.length; i += 1) {
        if (steps[i].response === undefined) {
          const quickReplies = [
            replyTemplates.exit,
          ];
          if (steps[i].type === PROMPT_CONSTANTS.LOCATION) {
            quickReplies.push(replyTemplates.location);
          }
          return this.messagingClient.send(
            `${this.snapshot.data_store.prompt.steps[i].instruction} (${i + 1}/${steps.length})`, quickReplies);
        }
      }
      return 'concluding_prompt';
    },
    async message() {
      if (!this.snapshot.data_store.prompt) return this.getBaseState();
      const steps = this.snapshot.data_store.prompt.steps;
      if (!steps) {
        this.delete('prompt');
        return this.getBaseState();
      }
      const nlpData = await nlp.message(this.snapshot.input.payload.text).then(n => n);
      if (nlpData.entities.intent && nlpData.entities.intent[0].value === 'speech.escape') {
        this.messagingClient.send('Ok! Let me know if theres something I can answer for you or forward to your local gov', replyTemplates.whatCanIAsk);
        this.delete('prompt');
        return this.getBaseState();
      }
      for (let i = 0; i < steps.length; i += 1) {
        if (steps[i].response === undefined) {
          const newSteps = this.snapshot.data_store.prompt.steps;
          if (steps[i].type === PROMPT_CONSTANTS.TEXT) {
            newSteps[i].response = {
              text: this.snapshot.input.payload.text,
            };
          } else if (steps[i].type === PROMPT_CONSTANTS.PICTURE) {
            newSteps[i].response = {
              pictures: this.snapshot.input.payload.attachments ?
                this.snapshot.input.payload.attachments : null,
            };
          } else if (steps[i].type === PROMPT_CONSTANTS.LOCATION) {
            let location = this.snapshot.input.payload.attachments ?
              this.snapshot.input.payload.attachments[0] : null;
            if (!location && this.snapshot.input.payload.text) {
              location = await createLocation(this.snapshot.input.payload.text,
                { returnJSON: true }).then(json => json);
            }
            newSteps[i].response = {
              location,
            };
          }
          const newPromptStore = this.get('prompt');
          newPromptStore.steps = newSteps;
          this.set('prompt', newPromptStore);
          break;
        }
      }
      this.input('enter');
    },
  },

  async concluding_prompt() {
    // Actions
    if (this.get('prompt').concluding_actions.task) {
      const contacts = await Promise.all((this.get('prompt').concluding_actions.knowledge_contacts || [])
        .map(contact => KnowledgeContact.where({ id: contact.id }).fetch().then(c => c.toJSON())));
      const params = {};
      this.get('prompt').steps.forEach(s => (params[s.param || s.instruction] = s.response));
      createTask(
        this.get('prompt').concluding_actions.task,
        params,
        {
          contacts,
          organization_id: this.get('organization').id,
          constituent_id: this.snapshot.constituent_id,
        },
        this.get('prompt').concluding_actions,
      );
    } else {
      const contactEmails = await Promise.all((this.get('prompt').concluding_actions.knowledge_contacts || [])
        .map(contact => KnowledgeContact.where({ id: contact.id }).fetch().then(c => ({ name: c.get('name'), email: c.get('email') }))));
      // // Send Email
      if (contactEmails.length > 0) {
        let emailMessage = `A constituent responded to "${this.get('prompt').name}":<br/><br/>`;
        this.get('prompt').steps.forEach((step, index) => {
          if (step.type === PROMPT_CONSTANTS.TEXT) emailMessage = emailMessage.concat(`<b>${index + 1}) ${step.instruction}</b><br/>${step.response.text}<br/><br/>`);
        });
        emailMessage = emailMessage.concat('If you have questions, send <a href="mailto:mark@mayor.chat">us</a> an email!');
        new EmailService().send('🤖 Constituent Response', emailMessage, contactEmails);
      }
    }
    // Conclude
    this.messagingClient.send('Thanks, I\'ll do my best to let you know of any updates.');
    return savePromptResponses(this.snapshot.data_store.prompt.steps, this.snapshot.constituent)
      .then(() => {
        this.delete('prompt');
        // Not sure why, but when I was doing a fire, it wasn't saving the new state and machine.
        this.snapshot.state_machine_name = 'smallTalk';
        this.current = 'start';
        this.save();
      });
  },

};
