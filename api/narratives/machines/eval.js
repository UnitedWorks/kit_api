import Mixpanel from '../../services/event-tracking';

export default {
  answer_helpful() {
    Mixpanel.track('answer_feedback', {
      constituent_id: this.snapshot.constituent.id,
      organization_id: this.get('organization').id,
      helpful: 5,
      interface: this.messagingClient.provider,
    });
    return 'personality.handle_thank_you';
  },
  answer_not_helpful() {
    Mixpanel.track('answer_feedback', {
      constituent_id: this.snapshot.constituent.id,
      organization_id: this.get('organization').id,
      helpful: 0,
      interface: this.messagingClient.provider,
    });
    return this.messagingClient.send('Sorry about that. My little bot brain is doing its best :/ Hope I can do better next time!')
      .then(() => this.getBaseState());
  },
};
