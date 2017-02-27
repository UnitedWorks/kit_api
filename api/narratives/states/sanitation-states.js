import KitClient from '../clients/kit-client';

export default {
  garbageSchedule() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-garbage-schedule').then((answer) => {
        return this.messagingClient.send(KitClient.answerToString(answer)).then(() => 'smallTalk.start');
      });
  },
  garbageDropOff() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-garbage-drop-off').then((answer) => {
        return this.messagingClient.send(KitClient.answerToString(answer)).then(() => 'smallTalk.start');
      });
  },
  recyclingSchedule() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-recycling-schedule').then((answer) => {
        return this.messagingClient.send(KitClient.answerToString(answer)).then(() => 'smallTalk.start');
      });
  },
  recyclingDropOff() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-recycling-drop-off').then((answer) => {
        return this.messagingClient.send(KitClient.answerToString(answer)).then(() => 'smallTalk.start');
      });
  },
  compostDumping() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-compost').then((answer) => {
        return this.messagingClient.send(KitClient.answerToString(answer)).then(() => 'smallTalk.start');
      });
  },
  bulkPickup() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-bulk-pickup').then((answer) => {
        return this.messagingClient.send(KitClient.answerToString(answer)).then(() => 'smallTalk.start');
      });
  },
  electronicsDisposal() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-electronics-disposal').then((answer) => {
        return this.messagingClient.send(KitClient.answerToString(answer)).then(() => 'smallTalk.start');
      });
  },
};
