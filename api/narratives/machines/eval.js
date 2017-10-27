import { EventTracker } from '../../services/event-tracking';
import SlackService from '../../services/slack';
import { logger } from '../../logger';

export default {
  answer_helpful() {
    new SlackService({
      username: 'Helpful',
      icon: 'raised_hands',
    }).send(`>*Con. ${this.snapshot.constituent.id}*`);
    try {
      EventTracker('answer_feedback', { session: this }, { helpful: 5 });
    } catch (e) {
      logger.error(e);
    }
    return 'personality.handle_thank_you';
  },
  answer_not_helpful() {
    new SlackService({
      username: 'Not Helpful',
      icon: 'disappointed',
    }).send(`>*Con. ${this.snapshot.constituent.id}*`);
    try {
      EventTracker('answer_feedback', { session: this }, { helpful: 0 });
    } catch (e) {
      logger.error(e);
    }
    return this.messagingClient.send('Sorry about that :/ Hope I can do better next time!')
      .then(() => this.getBaseState());
  },
};
