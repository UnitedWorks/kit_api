import KitClient from '../clients/kit-client';

export default {
  garbageSchedule() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-garbage-schedule').then((answers) => {
        return this.messagingClient.send(KitClient.answersToString(answers)).then(() => 'smallTalk.start');
      });
  },
  garbageDropOff() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-garbage-drop-off').then((answers) => {
        return this.messagingClient.send(KitClient.answersToString(answers)).then(() => 'smallTalk.start');
      });
  },
  recyclingSchedule() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-recycling-schedule').then((answers) => {
        return this.messagingClient.send(KitClient.answersToString(answers)).then(() => 'smallTalk.start');
      });
  },
  recyclingDropOff() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-recycling-drop-off').then((answers) => {
        return this.messagingClient.send(KitClient.answersToString(answers)).then(() => 'smallTalk.start');
      });
  },
  compostDumping() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-compost').then((answers) => {
        return this.messagingClient.send(KitClient.answersToString(answers)).then(() => 'smallTalk.start');
      });
  },
  bulkPickup() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-bulk-pickup').then((answers) => {
        return this.messagingClient.send(KitClient.answersToString(answers)).then(() => 'smallTalk.start');
      });
  },
  electronicsDisposal() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-electronics-disposal').then((answers) => {
        return this.messagingClient.send(KitClient.answersToString(answers)).then(() => 'smallTalk.start');
      });
  },
};
