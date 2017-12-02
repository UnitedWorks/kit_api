import { nlp } from '../../utils/nlp';
import * as PROMPT_CONSTANTS from '../../constants/prompts';
import * as replyTemplates from '../templates/quick-replies';
import { createShoutOut, promptStepsToParamValues } from '../../shouts/helpers';
import { createLocation } from '../../knowledge-base/helpers';

export default {

  waiting_for_acceptance: {
    enter(aux = {}) {
      return this.messagingClient.send(aux.message || `I can help you with ${`"${this.get('action').name}"` || 'this'}, but I need to ask a few questions. Is that ok?`, replyTemplates.sureNoThanks);
    },
    message() {
      return nlp.message(this.snapshot.input.payload.text || this.snapshot.input.payload.payload).then((nlpData) => {
        this.snapshot.nlp = nlpData;
        const entities = nlpData.entities;
        if (entities.intent && entities.intent[0]) {
          if (entities.intent.filter(i => i.value === 'speech.confirm').length > 0) {
            return this.messagingClient.send('Great!').then(() => 'waiting_for_response');
          }
          if (entities.intent.filter(i => i.value === 'speech.deny').length > 0) {
            this.delete('action');
            return this.messagingClient.send('Ok! No problem.').then(() => this.getBaseState());
          }
        }
        return this.messagingClient.send('Sorry, didn\'t catch that. Can I ask you a few quick questions?', replyTemplates.sureNoThanks);
      });
    },
  },

  waiting_for_response: {
    enter() {
      if (!this.get('action')) return this.getBaseState();
      const steps = this.get('action').params;
      if (!steps) {
        this.delete('action');
        return this.getBaseState();
      }
      for (let i = 0; i < steps.length; i += 1) {
        if (!steps[i].value) {
          const quickReplies = [replyTemplates.exit];
          if (steps[i].type === PROMPT_CONSTANTS.LOCATION) {
            quickReplies.push(replyTemplates.location);
          }
          return this.messagingClient.send(
            `${steps[i].instruction} (${i + 1}/${steps.length})`, quickReplies);
        }
      }
      return 'conclude';
    },
    action() {
      // On webview, the "nevermind quick reply always aims for this state"
      return this.input('message');
    },
    async message() {
      if (!this.get('action')) return this.getBaseState();
      const steps = this.get('action').params;
      if (!steps) {
        this.delete('action');
        return this.getBaseState();
      }
      const nlpData = await nlp.message(this.snapshot.input.payload.text || this.snapshot.input.payload.payload).then(n => n);
      if (nlpData.entities.intent && nlpData.entities.intent[0].value === 'speech.escape') {
        this.messagingClient.send('Ok! Let me know if there\'s something else I can answer or report for you.', replyTemplates.whatCanIAsk);
        this.delete('action');
        return this.getBaseState();
      }
      // Run through params/steps to first without value, set it, and run next param
      for (let i = 0; i < steps.length; i += 1) {
        // No value, so set it!
        if (!steps[i].value) {
          // Handle Text
          if (steps[i].type === PROMPT_CONSTANTS.TEXT) {
            steps[i].value = { text: this.snapshot.input.payload.text };
          // Handle Picture
          } else if (steps[i].type === PROMPT_CONSTANTS.BOOLEAN) {
            if (nlpData.entities.intent && nlpData.entities.intent[0].value === 'speech.confirm') {
              steps[i].value = { boolean: true };
            } else {
              steps[i].value = { boolean: false };
            }
          } else if (steps[i].type === PROMPT_CONSTANTS.EMAIL) {
            if (this.snapshot.input.payload.text.indexOf('@') > 0) {
              steps[i].value = { text: this.snapshot.input.payload.text };
            } else {
              this.messagingClient.send('That doesn\'t seem to be a valid email.');
            }
          // Handle Picture
          } else if (steps[i].type === PROMPT_CONSTANTS.IMAGE) {
            if (this.snapshot.input.payload.attachments) {
              const attached = this.snapshot.input.payload.attachments;
              steps[i].value = attached.filter(a => a.type === 'image').map(p => ({ type: 'image', url: p.payload.url }));
            } else {
              steps[i].value = {};
            }
          // Handle Location
          } else if (steps[i].type === PROMPT_CONSTANTS.LOCATION) {
            let location = this.snapshot.input.payload.attachments ?
              this.snapshot.input.payload.attachments[0] : null;
            // Is text
            if (!location && this.snapshot.input.payload.text) {
              location = await createLocation(this.snapshot.input.payload.text,
                { returnJSON: true }).then(json => json);
            // Is FB Object Attachment
            } else if (location && location.payload) {
              location = await createLocation({
                lat: location.payload.coordinates.lat,
                lon: location.payload.coordinates.long,
              }, { returnJSON: true }).then(json => json);
            }
            steps[i].value = { location };
          }
          const newActionStore = this.get('action');
          newActionStore.params = steps;
          this.set('action', newActionStore);
          break;
        }
      }
      return this.input('enter');
    },
  },

  async conclude() {
    // Shout Out
    if (this.get('action').shout_out) {
      createShoutOut(this.get('action').shout_out, promptStepsToParamValues(this.get('action').params), {
        organization_id: this.snapshot.organization_id,
        constituent_id: this.snapshot.constituent_id,
      });
    }
    // Conclude
    this.messagingClient.send('Thanks! When I get any updates, I\'ll send them your way.');
    // Not sure why, but when I was doing a fire, it wasn't saving the new state and machine.
    this.delete('action');
    this.snapshot.state_machine_name = 'smallTalk';
    this.current = 'start';
    this.save();
  },

};
