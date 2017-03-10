import KitClient from '../clients/kit-client';

export default {
  garbageSchedule() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-garbage-schedule').then((answers) => {
        return KitClient.standardAnswerAndProgress(this.messagingClient, answers, 'smallTalk.start');
      });
  },
  garbageDropOff() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-garbage-drop-off').then((answers) => {
        return KitClient.standardAnswerAndProgress(this.messagingClient, answers, 'smallTalk.start');
      });
  },
  recyclingSchedule() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-recycling-schedule').then((answers) => {
        return KitClient.standardAnswerAndProgress(this.messagingClient, answers, 'smallTalk.start');
      });
  },
  recyclingDropOff() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-recycling-drop-off').then((answers) => {
        return KitClient.standardAnswerAndProgress(this.messagingClient, answers, 'smallTalk.start');
      });
  },
  compostDumping() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-compost').then((answers) => {
        return KitClient.standardAnswerAndProgress(this.messagingClient, answers, 'smallTalk.start');
      });
  },
  bulkPickup() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-bulk-pickup').then((answers) => {
        return KitClient.standardAnswerAndProgress(this.messagingClient, answers, 'smallTalk.start');
      });
  },
  electronicsDisposal() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-electronics-disposal').then((answers) => {
        return KitClient.standardAnswerAndProgress(this.messagingClient, answers, 'smallTalk.start');
      });
  },
};
