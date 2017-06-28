import Mixpanel from '../../services/event-tracking';
import SlackService from '../../services/slack';

export default {
  answer_helpful() {
    Mixpanel.track('answer_feedback', {
      distinct_id: this.snapshot.constituent.id,
      constituent_id: this.snapshot.constituent.id,
      organization_id: this.get('organization').id,
      interface: this.messagingClient.provider,
      helpful: 5,
    });
    return 'personality.handle_thank_you';
  },
  answer_not_helpful() {
    new SlackService({
      username: 'Answer Not Helpful',
      icon: 'disappointed',
    }).send(`>*Constituent ID*: ${this.snapshot.constituent.id}`);
    Mixpanel.track('answer_feedback', {
      distinct_id: this.snapshot.constituent.id,
      constituent_id: this.snapshot.constituent.id,
      organization_id: this.get('organization').id,
      interface: this.messagingClient.provider,
      helpful: 0,
    });
    return this.messagingClient.send('Sorry about that. My little bot brain is doing its best :/ Hope I can do better next time!')
      .then(() => this.getBaseState());
  },
};
