import * as INTEGRATIONS from '../../constants/integrations';
import { hasIntegration } from '../../integrations/helpers';
import AskDarcelClient from '../clients/ask-darcel-client';
import KitClient from '../clients/kit-client';

export default {
  shelterSearch() {
    return hasIntegration(this.datastore.organization, INTEGRATIONS.ASK_DARCEL)
      .then((integrated) => {
        if (integrated) {
          return new AskDarcelClient({ location: this.get('location') })
            .getResources('shelter', { limit: 5 })
            .then((resources) => {
              this.messagingClient.addToQuene('Here are some places we\'ve found close to your location:\n');
              resources.forEach((resource) => {
                this.messagingClient.addToQuene(`${resource.name}\n${resource.phones[0] ? `${resource.phones[0].number}\n` : ''}${resource.website ? `${resource.website}\n` : ''}${resource.short_description || resource.long_description || ''}\n`.trim());
              });
              return this.messagingClient.runQuene().then(() => 'smallTalk.start');
            });
        }
        return new KitClient({ organization: this.get('organization') })
          .getAnswer('social-services-shelters').then((answer) => {
            const message = KitClient.answerToString(answer);
            return this.messagingClient.send(message).then(() => 'smallTalk.start');
          });
      });
  },
  foodSearch() {
    return hasIntegration(this.datastore.organization, INTEGRATIONS.ASK_DARCEL)
      .then((integrated) => {
        if (integrated) {
          return new AskDarcelClient({ location: this.get('location') })
            .getResources('food', { limit: 5 })
            .then((resources) => {
              this.messagingClient.addToQuene('Here are some places we\'ve found close to your location:\n');
              resources.forEach((resource) => {
                this.messagingClient.addToQuene(`${resource.name}\n${resource.phones[0] ? `${resource.phones[0].number}\n` : ''}${resource.website ? `${resource.website}\n` : ''}${resource.short_description || resource.long_description || ''}\n`.trim());
              });
              return this.messagingClient.runQuene().then(() => 'smallTalk.start');
            });
        }
        return new KitClient({ organization: this.get('organization') })
          .getAnswer('social-services-food-assistance').then((answer) => {
            const message = KitClient.answerToString(answer);
            return this.messagingClient.send(message).then(() => 'smallTalk.start');
          });
      });
  },
  hygieneSearch() {
    return hasIntegration(this.datastore.organization, INTEGRATIONS.ASK_DARCEL)
      .then((integrated) => {
        if (integrated) {
          return new AskDarcelClient({ location: this.get('location') })
            .getResources('hygiene', { limit: 5 })
            .then((resources) => {
              this.messagingClient.addToQuene('Here are some places we\'ve found close to your location:\n');
              resources.forEach((resource) => {
                this.messagingClient.addToQuene(`${resource.name}\n${resource.phones[0] ? `${resource.phones[0].number}\n` : ''}${resource.website ? `${resource.website}\n` : ''}${resource.short_description || resource.long_description || ''}\n`.trim());
              });
              return this.messagingClient.runQuene().then(() => 'smallTalk.start');
            });
        }
        return new KitClient({ organization: this.get('organization') })
          .getAnswer('social-services-hygiene').then((answer) => {
            const message = KitClient.answerToString(answer);
            return this.messagingClient.send(message).then(() => 'smallTalk.start');
          });
      });
  },
};
