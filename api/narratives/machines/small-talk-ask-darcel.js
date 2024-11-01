import { logger } from '../../logger';
import { nlp } from '../../utils/nlp';
import SlackService from '../../utils/slack';

const baseQuickReplies = [
  { content_type: 'text', title: 'Nearby Shelters', payload: 'Nearby Shelters' },
  { content_type: 'text', title: 'Public Restrooms', payload: 'Public Restrooms' },
  { content_type: 'text', title: 'Open Clinics', payload: 'Open Clinics' },
];

export default {
  handle_greeting() {
    this.messagingClient.send('Hey there! I\'m AskDarcel, a robot to help you find a nearby shelter, clinic, public restroom, or job assistance. That\'s all I can do, but I hope it can help you!', baseQuickReplies);
    return 'start';
  },
  start: {
    enter() {
      if (!this.get('location')) {
        this.set('location', {
          address: {
            city: 'SF',
            state: 'California',
            county: 'SF',
            country: 'United States of America',
            country_code: 'us',
          },
        });
      }
    },
    message() {
      const input = this.snapshot.input.payload;
      return nlp.message(input.text).then((nlpData) => {
        this.snapshot.nlp = nlpData;

        logger.info(nlpData);

        const entities = nlpData.entities;
        const intentMap = {
          'speech.greeting': 'handle_greeting',
          'social_services.shelters': 'socialServices.waiting_shelter_search',
          'social_services.food_assistance': 'socialServices.waiting_food_search',
          'social_services.hygiene': 'socialServices.waiting_hygiene_search',
          'health_medicine.clinics': 'health.waiting_clinic_search',
          'education_employment.employment_job_training': 'employment.waiting_job_training',
        };

        if (entities.intent && entities.intent[0]) {
          return Promise.resolve(intentMap[entities.intent[0].value]);
        }
        return 'failed_request';
      });
    },
  },
  failed_request(aux = {}) {
    new SlackService({
      username: 'Misunderstood Request - AskDarcel',
      icon: 'question',
    }).send(`>*Request Message*: ${aux.input.payload.text}\n>*Constituent ID*: ${this.snapshot.constituent.id}`);
    const message = 'Im just a bot so I may not be understanding. I can help you find a shelter, clinics, or places to wash up';
    this.messagingClient.send(message, baseQuickReplies);
    return 'start';
  },
};
