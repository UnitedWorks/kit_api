import * as INTEGRATIONS from '../../constants/integrations';
import { hasIntegration } from '../../integrations/helpers';
import AskDarcelClient from '../clients/ask-darcel-client';
import KitClient from '../clients/kit-client';
import { messageToGeodata } from '../../utils/nlp';

export default {
  waiting_shelter_search: {
    enter() {
      if (!this.get('location') || !this.get('location').address) return this.stateRedirect('location', 'socialServices.waiting_shelter_search');
      return hasIntegration(this.get('organization'), INTEGRATIONS.ASK_DARCEL)
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
            .getResources('shelter', { limit: 5 })
            .then((resources) => {
              this.messagingClient.addToQuene('Here\'s what I\'ve found close to you\n');
              resources.forEach((resource) => {
                this.messagingClient.addToQuene(`${resource.name}\n${resource.phones[0] ? `${resource.phones[0].number}\n` : ''}${resource.website ? `${resource.website}\n` : ''}${resource.short_description || resource.long_description || ''}\n`.trim());
              });
              return this.messagingClient.runQuene().then(() => {
                return this.getBaseState();
              });
            });
        });
      }
      return new KitClient({ organization: this.get('organization') })
        .getAnswer('social_services_shelters').then((answers) => {
          this.messagingClient.addAll(KitClient.genericTemplateFromAnswers(answers));
          return this.messagingClient.runQuene().then(() => this.getBaseState());
        });
    },
  },

  waiting_food_search: {
    enter() {
      if (!this.get('location') || !this.get('location').address) return this.stateRedirect('location', 'socialServices.waiting_food_search');
      return hasIntegration(this.get('organization'), INTEGRATIONS.ASK_DARCEL)
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
            .getResources('food', { limit: 5 })
            .then((resources) => {
              this.messagingClient.addToQuene('Here\'s what I\'ve found close to you\n');
              resources.forEach((resource) => {
                this.messagingClient.addToQuene(`${resource.name}\n${resource.phones[0] ? `${resource.phones[0].number}\n` : ''}${resource.website ? `${resource.website}\n` : ''}${resource.short_description || resource.long_description || ''}\n`.trim());
              });
              return this.messagingClient.runQuene().then(() => {
                return this.getBaseState();
              });
            });
        });
      }
      return new KitClient({ organization: this.get('organization') })
        .getAnswer('social_services_food_assistance').then((answers) => {
          this.messagingClient.addAll(KitClient.genericTemplateFromAnswers(answers));
          return this.messagingClient.runQuene().then(() => this.getBaseState());
        });
    },
  },
  waiting_hygiene_search: {
    enter() {
      if (!this.get('location') || !this.get('location').address) return this.stateRedirect('location', 'socialServices.waiting_hygiene_search');
      return hasIntegration(this.get('organization'), INTEGRATIONS.ASK_DARCEL)
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
            .getResources('hygiene', { limit: 5 })
            .then((resources) => {
              this.messagingClient.addToQuene('Here\'s what I\'ve found close to you\n');
              resources.forEach((resource) => {
                this.messagingClient.addToQuene(`${resource.name}\n${resource.phones[0] ? `${resource.phones[0].number}\n` : ''}${resource.website ? `${resource.website}\n` : ''}${resource.short_description || resource.long_description || ''}\n`.trim());
              });
              return this.messagingClient.runQuene().then(() => {
                return this.getBaseState();
              });
            });
        });
      }
      return new KitClient({ organization: this.get('organization') })
        .getAnswer('social_services_hygiene').then((answers) => {
          this.messagingClient.addAll(KitClient.genericTemplateFromAnswers(answers));
          return this.messagingClient.runQuene().then(() => this.getBaseState());
        });
    },
  },
};
