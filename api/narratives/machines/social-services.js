import * as INTEGRATIONS from '../../constants/integrations';
import { getIntegrationConfig } from '../../integrations/helpers';
import AskDarcelClient from '../clients/ask-darcel-client';
import { fetchAnswers } from '../helpers';
import { messageToGeodata } from '../../utils/nlp';

export default {
  waiting_shelter_search: {
    async enter() {
      // Check for AskDarcel Integration
      const askDarcelConfig = await getIntegrationConfig(this.snapshot.organization_id, INTEGRATIONS.ASK_DARCEL).then(c => c);
      if (!askDarcelConfig) return this.input('message', { integrated: false });
      // Otherwise Continue
      if (!this.snapshot.organization.address) return this.stateRedirect('location', 'socialServices.waiting_shelter_search');
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
            .getResources('shelter', { limit: 5 })
            .then((resources) => {
              this.messagingClient.addToQuene('Here\'s what I\'ve found close to you\n');
              resources.forEach((resource) => {
                this.messagingClient.addToQuene(`${resource.name}\n${resource.phones[0] ? `${resource.phones[0].number}\n` : ''}${resource.website ? `${resource.website}\n` : ''}${resource.short_description || resource.long_description || ''}\n`.trim());
              });
              return this.messagingClient.runQuene().then(() => this.getBaseState());
            });
        });
      }
      return Promise.resolve(fetchAnswers('social_services.shelter', this));
    },
  },

  waiting_food_search: {
    async enter() {
      // Check for AskDarcel Integration
      const askDarcelConfig = await getIntegrationConfig(this.snapshot.organization_id, INTEGRATIONS.ASK_DARCEL).then(c => c);
      if (!askDarcelConfig) return this.input('message', { integrated: false });
      // Otherwise Continue
      if (!this.snapshot.organization.address) return this.stateRedirect('location', 'socialServices.waiting_food_search');
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
            .getResources('food', { limit: 5 })
            .then((resources) => {
              this.messagingClient.addToQuene('Here\'s what I\'ve found close to you\n');
              resources.forEach((resource) => {
                this.messagingClient.addToQuene(`${resource.name}\n${resource.phones[0] ? `${resource.phones[0].number}\n` : ''}${resource.website ? `${resource.website}\n` : ''}${resource.short_description || resource.long_description || ''}\n`.trim());
              });
              return this.messagingClient.runQuene().then(() => this.getBaseState());
            });
        });
      }
      return Promise.resolve(fetchAnswers('social_services.food_assistance', this));
    },
  },
  waiting_hygiene_search: {
    async enter() {
      // Check for AskDarcel Integration
      const askDarcelConfig = await getIntegrationConfig(this.snapshot.organization_id, INTEGRATIONS.ASK_DARCEL).then(c => c);
      if (!askDarcelConfig) return this.input('message', { integrated: false });
      // Otherwise Continue
      if (!this.snapshot.organization.address) return this.stateRedirect('location', 'socialServices.waiting_hygiene_search');
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
            .getResources('hygiene', { limit: 5 })
            .then((resources) => {
              this.messagingClient.addToQuene('Here\'s what I\'ve found close to you\n');
              resources.forEach((resource) => {
                this.messagingClient.addToQuene(`${resource.name}\n${resource.phones[0] ? `${resource.phones[0].number}\n` : ''}${resource.website ? `${resource.website}\n` : ''}${resource.short_description || resource.long_description || ''}\n`.trim());
              });
              return this.messagingClient.runQuene().then(() => this.getBaseState());
            });
        });
      }
      return Promise.resolve(fetchAnswers('social_services.hygiene', this));
    },
  },
};
