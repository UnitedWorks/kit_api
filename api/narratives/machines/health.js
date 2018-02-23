import * as INTEGRATIONS from '../../constants/integrations';
import { getIntegrationConfig } from '../../integrations/helpers';
import AskDarcelClient from '../clients/ask-darcel-client';
import { fetchAnswers } from '../helpers';
import { messageToGeodata } from '../../utils/nlp';

export default {
  waiting_clinic_search: {
    async enter() {
      // Check for AskDarcel Integration
      const askDarcelConfig = await getIntegrationConfig(this.snapshot.organization_id, INTEGRATIONS.ASK_DARCEL).then(c => c);
      if (!askDarcelConfig) return this.input('message', { integrated: false });
      // Otherwise Continue
      if (!this.snapshot.organization.address) return this.stateRedirect('location', 'health.waiting_clinic_search');
      return this.messagingClient.send('What address are you currently at? I want to make sure I give you locations close by.');
    },
    message(aux = {}) {
      if (aux.input && aux.integrated !== false) {
        return messageToGeodata(aux.input.payload.text, this.get('location')).then((geoData) => {
          if (geoData === null) {
            this.messagingClient.send('I didn\'t understand that address. Can you try again?');
            return null;
          }
          return new AskDarcelClient({ location: geoData })
            .getResources('medical', { limit: 5 })
            .then((resources) => {
              if (resources && resources.length > 0) {
                this.messagingClient.addToQuene('Here\'s what I\'ve found close to you\n');
                resources.forEach((resource) => {
                  this.messagingClient.addToQuene(`${resource.name}\n${resource.phones[0] ? `${resource.phones[0].number}\n` : ''}${resource.website ? `${resource.website}\n` : ''}${resource.short_description || resource.long_description || ''}\n`.trim());
                });
              } else {
                this.messagingClient.addToQuene('Sorry, I didn\'t find anything nearby.');
              }
              return this.messagingClient.runQuene().then(() => this.getBaseState());
            });
        });
      }
      return Promise.resolve(fetchAnswers('health_medicine.clinics', this));
    },
  },
};
