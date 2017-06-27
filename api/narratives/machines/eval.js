import Mixpanel from '../../services/event-tracking';

export default {
  answer_helpful() {
    Mixpanel.track('answer_given', {
      constituent_id: this.snapshot.constituent.id,
      organization_id: this.get('organization').id,
      helpfulness: 10,
    });
    return 'personality.handle_thank_you';
  },
  answer_not_helpful() {
    Mixpanel.track('answer_given', {
      constituent_id: this.snapshot.constituent.id,
      organization_id: this.get('organization').id,
      helpfulness: 0,
    });
    return this.messagingClient.send('Sorry about that. My little bot brain is doing its best :/ Hope I can do better next time!')
      .then(() => this.getBaseState());
  },
};
