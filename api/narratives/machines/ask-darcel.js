import { logger } from '../../logger';
import * as TAGS from '../../constants/nlp-tagging';
import { nlp } from '../../services/nlp';
import { entityValueIs } from '../helpers';
import SlackService from '../../services/slack';

export default {
  start: {
    message() {
      const input = this.snapshot.input.payload;
      return nlp.message(input.text, {}).then((nlpData) => {
        this.set('nlp', nlpData.entities);
        const entities = nlpData.entities;
        logger.info(nlpData);
        if (entities[TAGS.SOCIAL_SERVICES]) {
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
    const message = 'Ah shoot, I\'m still learning so I don\'t understand that request yet. Can you give more description? <3';
    this.messagingClient.send(message);
    return 'start';
  },
};
