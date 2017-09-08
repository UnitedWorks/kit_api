import Mixpanel from '../../services/event-tracking';
import SlackService from '../../services/slack';
import { logger } from '../../logger';

export default {
  answer_helpful() {
    new SlackService({
      username: 'Answer Helpful!',
      icon: 'raised_hands',
    }).send(`>*Constituent ID*: ${this.snapshot.constituent.id}`);
    try {
      Mixpanel.track('answer_feedback', {
        distinct_id: this.snapshot.constituent.id,
        constituent_id: this.snapshot.constituent.id,
        organization_id: this.get('organization').id,
        interface: this.messagingClient.provider,
        helpful: 5,
      });
    } catch (e) {
      logger.error(e);
    }
    return 'personality.handle_thank_you';
  },
  answer_not_helpful() {
    new SlackService({
      username: 'Answer Not Helpful',
      icon: 'disappointed',
    }).send(`>*Constituent ID*: ${this.snapshot.constituent.id}`);
    try {
      Mixpanel.track('answer_feedback', {
        distinct_id: this.snapshot.constituent.id,
        constituent_id: this.snapshot.constituent.id,
        organization_id: this.get('organization').id,
        interface: this.messagingClient.provider,
        helpful: 0,
      });
    } catch (e) {
      logger.error(e);
    }
    return this.messagingClient.send('Sorry about that. My little bot brain is doing its best :/ Hope I can do better next time!')
      .then(() => this.getBaseState());
  },
};
