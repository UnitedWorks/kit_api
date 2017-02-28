import * as INTEGRATIONS from '../../constants/integrations';
import { hasIntegration } from '../../integrations/helpers';
import AskDarcelClient from '../clients/ask-darcel-client';
import KitClient from '../clients/kit-client';
import { messageToGeodata } from '../../services/nlp';

export default {
  waiting_job_training: {
    enter() {
      return hasIntegration(this.datastore.organization, INTEGRATIONS.ASK_DARCEL)
        .then((integrated) => {
          if (integrated) {
            this.messagingClient.send('What address are you currently at? I want to make sure I give you locations close by.');
            return null;
          }
          return this.input('message', { integrated: false });
        });
    },
    message(aux = {}) {
      if (aux.input && aux.integrated !== false) {
        return messageToGeodata(aux.input.payload.text, this.get('location')).then((geoData) => {
          if (geoData === null) {
            this.messagingClient.send('I didn\'t understand that address. Can you try again?');
            return null;
          }
          return new AskDarcelClient({ location: geoData })
            .getResources('technology', { limit: 5 })
            .then((resources) => {
              this.messagingClient.addToQuene('Here\'s what I\'ve found close to you\n');
              resources.forEach((resource) => {
                this.messagingClient.addToQuene(`${resource.name}\n${resource.phones[0] ? `${resource.phones[0].number}\n` : ''}${resource.website ? `${resource.website}\n` : ''}${resource.short_description || resource.long_description || ''}\n`.trim());
              });
              return this.messagingClient.runQuene().then(() => 'smallTalk.start');
            });
        });
      }
      return new KitClient({ organization: this.get('organization') })
        .getAnswer('employment-job-training').then((answer) => {
          const message = KitClient.answerToString(answer);
          return this.messagingClient.send(message).then(() => 'smallTalk.start');
        });
    },
  },
};
