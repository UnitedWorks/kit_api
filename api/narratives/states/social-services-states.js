import axios from 'axios';
import * as INTEGRATIONS from '../../constants/integrations';
import { hasIntegration } from '../../integrations/helpers';
import { getAnswer } from '../../knowledge-base/helpers';

export default {
  shelterSearch() {
    return hasIntegration(this.datastore.organization, INTEGRATIONS.ASK_DARCEL)
      .then((integrated) => {
        if (integrated) {
          return axios.get('https://staging.askdarcel.org/api/resources', {
            params: {
              category_id: 1,
              lat: this.get('location').latitude,
              long: this.get('location').longitude,
            },
          }).then((response) => {
            const body = response.data;
            const resources = body.resources;
            const counter = resources.length > 5 ? 5 : resources.length;
            this.messagingClient.addToQuene('Here are some places we\'ve found close to your location:\n');
            for (let i = counter; i > 0; i -= 1) {
              const resource = resources[i];
              this.messagingClient.addToQuene(`${resource.name}\n${resource.phones[0] ? `${resource.phones[0].number}\n` : ''}${resource.website ? `${resource.website}\n` : ''}${resource.short_description || resource.long_description || ''}\n`.trim());
            }
            return this.messagingClient.runQuene().then(() => 'smallTalk.start');
          });
        }
        return getAnswer({
          label: 'social-services-shelters',
          organization_id: this.get('organization').id,
        }, { withRelated: true, returnJSON: true }).then((payload) => {
          let message;
          if (payload.answer) {
            const answer = payload.answer;
            message = answer.url ? `${answer.text} (More info at ${answer.url})` : `${answer.text}`;
          } else {
            message = 'I\'m sorry. I can\'t find anything in our database. I\'m going to let the city know about your need.';
          }
          this.messagingClient.send(message);
          return 'smallTalk.start';
        });
      });
  },
  foodSearch() {
    return hasIntegration(this.datastore.organization, INTEGRATIONS.ASK_DARCEL)
      .then((integrated) => {
        if (integrated) {
          return axios.get('https://staging.askdarcel.org/api/resources', {
            params: {
              category_id: 2,
              lat: this.get('location').latitude,
              long: this.get('location').longitude,
            },
          }).then((response) => {
            const body = response.data;
            const resources = body.resources;
            const counter = resources.length > 5 ? 5 : resources.length;
            this.messagingClient.addToQuene('Here are some places we\'ve found close to your location:\n');
            for (let i = counter; i > 0; i -= 1) {
              const resource = resources[i];
              this.messagingClient.addToQuene(`${resource.name}\n${resource.phones[0] ? `${resource.phones[0].number}\n` : ''}${resource.website ? `${resource.website}\n` : ''}${resource.short_description || resource.long_description || ''}\n`.trim());
            }
            return this.messagingClient.runQuene().then(() => 'smallTalk.start');
          });
        }
        return getAnswer({
          label: 'social-services-food-assistance',
          organization_id: this.get('organization').id,
        }, { withRelated: true, returnJSON: true }).then((payload) => {
          let message;
          if (payload.answer) {
            const answer = payload.answer;
            message = answer.url ? `${answer.text} (More info at ${answer.url})` : `${answer.text}`;
          } else {
            message = 'I\'m sorry. I can\'t find anything in our database. I\'m going to let the city know about your need.';
          }
          this.messagingClient.send(message);
          return 'smallTalk.start';
        });
      });
  },
  hygieneSearch() {
    return hasIntegration(this.datastore.organization, INTEGRATIONS.ASK_DARCEL)
      .then((integrated) => {
        if (integrated) {
          return axios.get('https://staging.askdarcel.org/api/resources', {
            params: {
              category_id: 4,
              lat: this.get('location').latitude,
              long: this.get('location').longitude,
            },
          }).then((response) => {
            const body = response.data;
            const resources = body.resources;
            const counter = resources.length > 5 ? 5 : resources.length;
            this.messagingClient.addToQuene('Here are some places we\'ve found close to your location:\n');
            for (let i = counter; i > 0; i -= 1) {
              const resource = resources[i];
              this.messagingClient.addToQuene(`${resource.name}\n${resource.phones[0] ? `${resource.phones[0].number}\n` : ''}${resource.website ? `${resource.website}\n` : ''}${resource.short_description || resource.long_description || ''}\n`.trim());
            }
            return this.messagingClient.runQuene().then(() => 'smallTalk.start');
          });
        }
        return getAnswer({
          label: 'social-services-hygiene',
          organization_id: this.get('organization').id,
        }, { withRelated: true, returnJSON: true }).then((payload) => {
          let message;
          if (payload.answer) {
            const answer = payload.answer;
            message = answer.url ? `${answer.text} (More info at ${answer.url})` : `${answer.text}`;
          } else {
            message = 'I\'m sorry. I can\'t find anything in our database. I\'m going to let the city know about your need.';
          }
          this.messagingClient.send(message);
          return 'smallTalk.start';
        });
      });
  },
};
