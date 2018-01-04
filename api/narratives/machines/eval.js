import { EventTracker } from '../../utils/event-tracking';
import SlackService from '../../utils/slack';

export default {
  answer_helpful() {
    new SlackService({
      username: 'Helpful',
      icon: 'raised_hands',
    }).send(`>*Con. ${this.snapshot.constituent.id}*`);
    EventTracker('answer_not_helpful', { session: this });
    return 'personality.handle_thank_you';
  },
  answer_not_helpful: {
    enter() {
      new SlackService({
        username: 'Not Helpful',
        icon: 'disappointed',
      }).send(`>*Con. ${this.snapshot.constituent.id}*`);
      EventTracker('answer_helpful', { session: this });
      this.messagingClient.send('Sorry about that. Why wasn\'t this answer helpful?');
    },
    message() {
      new SlackService({
        username: 'Not Helpful',
        icon: 'disappointed',
      }).send(`>*Con. ${this.snapshot.constituent.id}*  Feedback - ${this.snapshot.input.payload.text}`);
      return this.messagingClient.send('Thank you for the feedback. I will make a note of this for next time.')
        .then(() => this.getBaseState());
    },
  },
};
