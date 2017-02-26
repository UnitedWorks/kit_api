import { getAnswer } from '../../knowledge-base/helpers';

const getMessage = (requestLabel, org) => {
  return getAnswer({
    label: requestLabel,
    organization_id: org.id,
  }, {
    withRelated: false,
    returnJSON: true,
  }).then((payload) => {
    let message;
    if (payload.answer) {
      const answer = payload.answer;
      message = answer.url ? `${answer.text} (More info at ${answer.url})` : `${answer.text}`;
    } else {
      message = `:( Your city (${org.name}) hasn't given me an answer for that yet.`;
    }
    return message;
  });
};

export default {
  garbageSchedule() {
    return getMessage('sanitation-garbage-schedule', this.get('organization'))
      .then(message => this.messagingClient.send(message).then(() => 'smallTalk.start'));
  },
  garbageDropOff() {
    return getMessage('sanitation-garbage-drop-off', this.get('organization'))
      .then(message => this.messagingClient.send(message).then(() => 'smallTalk.start'));
  },
  recyclingSchedule() {
    return getMessage('sanitation-recycling-schedule', this.get('organization'))
      .then(message => this.messagingClient.send(message).then(() => 'smallTalk.start'));
  },
  recyclingDropOff() {
    return getMessage('sanitation-recycling-drop-off', this.get('organization'))
      .then(message => this.messagingClient.send(message).then(() => 'smallTalk.start'));
  },
  compostDumping() {
    return getMessage('sanitation-compost', this.get('organization'))
      .then(message => this.messagingClient.send(message).then(() => 'smallTalk.start'));
  },
  bulkPickup() {
    return getMessage('sanitation-bulk-pickup', this.get('organization'))
      .then(message => this.messagingClient.send(message).then(() => 'smallTalk.start'));
  },
  electronicsDisposal() {
    return getMessage('sanitation-electronics-disposal', this.get('organization'))
      .then(message => this.messagingClient.send(message).then(() => 'smallTalk.start'));
  },
};
