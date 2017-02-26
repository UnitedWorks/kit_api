import { getAnswer } from '../../knowledge-base/helpers';

const getMessage = (requestLabel, orgId) => {
  return getAnswer({
    label: requestLabel,
    organization_id: orgId,
  }, {
    withRelated: false,
    returnJSON: true,
  }).then((payload) => {
    let message;
    if (payload.answer) {
      const answer = payload.answer;
      message = answer.url ? `${answer.text} (More info at ${answer.url})` : `${answer.text}`;
    } else {
      message = `:( Your city (${this.get('organization').name}) hasn't given me an answer for this yet.`;
    }
    return message;
  });
};

export default {
  garbageSchedule() {
    return getMessage('sanitation-garbage-schedule', this.get('organization').id)
      .then(message => this.messagingClient.send(message).then(() => 'smallTalk.start'));
  },
  garbageDropOff() {
    return getMessage('sanitation-garbage-drop-off', this.get('organization').id)
      .then(message => this.messagingClient.send(message).then(() => 'smallTalk.start'));
  },
  recyclingSchedule() {
    return getMessage('sanitation-recycling-schedule', this.get('organization').id)
      .then(message => this.messagingClient.send(message).then(() => 'smallTalk.start'));
  },
  recyclingDropOff() {
    return getMessage('sanitation-recycling-pickup', this.get('organization').id)
      .then(message => this.messagingClient.send(message).then(() => 'smallTalk.start'));
  },
  compostDumping() {
    return getMessage('sanitation-compost', this.get('organization').id)
      .then(message => this.messagingClient.send(message).then(() => 'smallTalk.start'));
  },
  bulkPickupRequest() {
    return getMessage('sanitation-bulk-pickup', this.get('organization').id)
      .then(message => this.messagingClient.send(message).then(() => 'smallTalk.start'));
  },
  electronicsDisposal() {
    return getMessage('sanitation-electronics-disposal', this.get('organization').id)
      .then(message => this.messagingClient.send(message).then(() => 'smallTalk.start'));
  },
};
