import { nlp } from '../../services/nlp';
import { createConstituentCase, addCaseNote } from '../../cases/helpers';
import { getPrompt, savePromptResponses } from '../../prompts/helpers';
import * as CASE_CONSTANTS from '../../constants/cases';
import * as PROMPT_CONSTANTS from '../../constants/prompts';
import * as replyTemplates from '../templates/quick-replies';

export default {
  loading_prompt: {
    enter() {
      const label = this.snapshot.nlp.entities ?
        this.snapshot.nlp.entities.intent[0].value : 'create_case';
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
      const questions = this.snapshot.data_store.prompt.steps;
      if (!questions) {
        this.delete('prompt');
        return this.getBaseState();
      }
      for (let i = 0; i < questions.length; i += 1) {
        if (questions[i].answer === undefined) {
          const quickReplies = [
            replyTemplates.exit,
          ];
          if (questions[i].type === PROMPT_CONSTANTS.LOCATION) {
            quickReplies.push(replyTemplates.location);
          }
          return this.messagingClient.send(
            this.snapshot.data_store.prompt.steps[i].instruction, quickReplies);
        }
      }
      return 'concluding_prompt';
    },
    message() {
      if (!this.snapshot.data_store.prompt) return this.getBaseState();
      const questions = this.snapshot.data_store.prompt.steps;
      if (!questions) {
        this.delete('prompt');
        return this.getBaseState();
      }
      return nlp.message(this.snapshot.input.payload.text).then((nlpData) => {
        if (nlpData.entities.intent && nlpData.entities.intent[0].value === 'speech.escape') {
          this.messagingClient.send('Ok! Let me know if theres something I can answer for you or forward to your local gov', replyTemplates.whatCanIAsk);
          this.delete('prompt');
          return this.getBaseState();
        }
        for (let i = 0; i < questions.length; i += 1) {
          if (questions[i].answer === undefined) {
            const newQuestions = this.snapshot.data_store.prompt.steps;
            if (questions[i].type === PROMPT_CONSTANTS.TEXT) {
              newQuestions[i].answer = {
                text: this.snapshot.input.payload.text,
              };
            } else if (questions[i].type === PROMPT_CONSTANTS.PICTURE) {
              newQuestions[i].answer = {
                pictures: this.snapshot.input.payload.attachments ?
                  this.snapshot.input.payload.attachments : null,
              };
            } else if (questions[i].type === PROMPT_CONSTANTS.LOCATION) {
              newQuestions[i].answer = {
                location: this.snapshot.input.payload.attachments ?
                  this.snapshot.input.payload.attachments[0] : null,
              };
            }
            const newPromptStore = this.get('prompt');
            newPromptStore.questions = newQuestions;
            this.set('prompt', newPromptStore);
            break;
          }
        }
        this.input('enter');
      });
    },
  },

  concluding_prompt: {
    enter() {
      this.input(this.get('prompt').concluding_action || 'default');
    },
    message() {
      // Backup incase an error was thrown and state didnt resolve from enter()
      this.input(this.get('prompt').concluding_action || 'default');
    },
    default() {
      this.messagingClient.send('Great, those were all my questions. Thank you so much!');
      return savePromptResponses(this.snapshot.data_store.prompt.steps, this.snapshot.constituent)
        .then(() => {
          this.delete('prompt');
          // Not sure why, but when I was doing a fire, it wasn't saving the new state and machine.
          this.snapshot.state_machine_name = 'smallTalk';
          this.current = 'start';
          this.save();
        });
    },
    create_case() {
      const questions = this.get('prompt').questions;
      const title = this.get('prompt').name;
      const caseId = this.get('prompt').case_id;
      const description = questions.filter(q => q.type === PROMPT_CONSTANTS.TEXT)[0].answer.text;
      const pictureQuestions = questions.filter(q => q.type === PROMPT_CONSTANTS.PICTURE);
      let pictures;
      if (pictureQuestions.length > 0) {
        pictures = pictureQuestions[0].answer.pictures;
      }
      const locationQuestions = questions.filter(q => q.type === PROMPT_CONSTANTS.LOCATION);
      let location;
      if (locationQuestions.length > 0) {
        location = locationQuestions[0].answer.location;
      }
      let query;
      // If ID exists, update case rather than create new
      if (caseId) {
        query = addCaseNote(caseId, `Q: ${title} -- A: ${description} `);
      } else {
        // Create New
        query = createConstituentCase({
          title,
          description,
          type: CASE_CONSTANTS.REQUEST,
          location,
          attachments: pictures,
        },
        this.snapshot.constituent,
        this.get('organization') || { id: this.snapshot.organization_id,
        });
      }
      return query.then(() => {
        this.messagingClient.send('I\'ve sent your message along and will keep you updated!');
        this.delete('prompt');
        this.snapshot.state_machine_name = 'smallTalk';
        this.current = 'start';
        this.save();
      });
    },
  },

};
