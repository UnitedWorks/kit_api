import KitClient from '../clients/kit-client';

export default {
  garbageSchedule() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-garbage-schedule')
      .then((payload) => {
        return this.messagingClient.send(KitClient.payloadToMessage(payload)).then(() => 'smallTalk.start');
      });
  },
  garbageDropOff() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-garbage-drop-off')
      .then((payload) => {
        return this.messagingClient.send(KitClient.payloadToMessage(payload)).then(() => 'smallTalk.start');
      });
  },
  recyclingSchedule() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-recycling-schedule')
      .then((payload) => {
        return this.messagingClient.send(KitClient.payloadToMessage(payload)).then(() => 'smallTalk.start');
      });
  },
  recyclingDropOff() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-recycling-drop-off')
      .then((payload) => {
        return this.messagingClient.send(KitClient.payloadToMessage(payload)).then(() => 'smallTalk.start');
      });
  },
  compostDumping() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-compost')
      .then((payload) => {
        return this.messagingClient.send(KitClient.payloadToMessage(payload)).then(() => 'smallTalk.start');
      });
  },
  bulkPickup() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-bulk-pickup')
      .then((payload) => {
        return this.messagingClient.send(KitClient.payloadToMessage(payload)).then(() => 'smallTalk.start');
      });
  },
  electronicsDisposal() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-electronics-disposal')
      .then((payload) => {
        return this.messagingClient.send(KitClient.payloadToMessage(payload)).then(() => 'smallTalk.start');
      });
  },
};
