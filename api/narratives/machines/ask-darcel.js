import { logger } from '../../logger';
import * as TAGS from '../../constants/nlp-tagging';
import { nlp } from '../../services/nlp';
import { entityValueIs } from '../helpers';
import SlackService from '../../services/slack';

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
    message() {
      const input = this.snapshot.input.payload;
      return nlp.message(input.text, {}).then((nlpData) => {
        this.set('nlp', nlpData.entities);
        const entities = nlpData.entities;
        logger.info(nlpData);

        // Greeting
        if (entities[TAGS.SMALL_TALK]) {
          if (entityValueIs(entities[TAGS.SMALL_TALK], [TAGS.GREETING])) {
            return 'handle_greeting';
          }
        } else if (entities[TAGS.SOCIAL_SERVICES]) {
          // Shelters
          if (entityValueIs(entities[TAGS.SOCIAL_SERVICES], [TAGS.SHELTER_SEARCH])) return 'socialServices.waiting_shelter_search';
          // Food
          if (entityValueIs(entities[TAGS.SOCIAL_SERVICES], [TAGS.FOOD_SEARCH])) return 'socialServices.waiting_food_search';
          // Hygiene
          if (entityValueIs(entities[TAGS.SOCIAL_SERVICES], [TAGS.HYGIENE_SEARCH])) return 'socialServices.waiting_hygiene_search';
          // Fallback
          return 'failedRequest';

        // Medical Services
        } else if (entities[TAGS.HEALTH]) {
          // Clinics
          if (entityValueIs(entities[TAGS.HEALTH], [TAGS.CLINIC_SEARCH])) return 'health.waiting_clinic_search';
          // Fallback
          return 'failedRequest';

        // Employment Services
        } else if (entities[TAGS.EMPLOYMENT]) {
          // Job Training
          if (entityValueIs(entities[TAGS.EMPLOYMENT], [TAGS.JOB_TRAINING])) return 'employment.waiting_job_training';
          // Fallback
          return 'failedRequest';
        }
        return 'failedRequest';
      });
    },
  },
  failedRequest(aux = {}) {
    new SlackService({
      username: 'Misunderstood Request - AskDarcel',
      icon: 'question',
    }).send(`>*Request Message*: ${aux.input.payload.text}\n>*Constituent ID*: ${this.snapshot.constituent.id}`);
    const message = 'Im just a bot so I may not be understanding. I can help you find a shelter, clinics, or places to wash up';
    this.messagingClient.send(message, baseQuickReplies);
    return 'start';
  },
};
