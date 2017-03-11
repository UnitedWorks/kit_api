import KitClient from '../clients/kit-client';

export default {
  garbageSchedule() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-garbage-schedule').then((answers) => {
        this.messagingClient.addAll(KitClient.compileAnswers(answers));
        return this.messagingClient.runQuene().then(() => 'smallTalk.start');
      });
  },
  garbageDropOff() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-garbage-drop-off').then((answers) => {
        this.messagingClient.addAll(KitClient.compileAnswers(answers));
        return this.messagingClient.runQuene().then(() => 'smallTalk.start');
      });
  },
  recyclingSchedule() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-recycling-schedule').then((answers) => {
        this.messagingClient.addAll(KitClient.compileAnswers(answers));
        return this.messagingClient.runQuene().then(() => 'smallTalk.start');
      });
  },
  recyclingDropOff() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-recycling-drop-off').then((answers) => {
        this.messagingClient.addAll(KitClient.compileAnswers(answers));
        return this.messagingClient.runQuene().then(() => 'smallTalk.start');
      });
  },
  compostDumping() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-compost').then((answers) => {
        this.messagingClient.addAll(KitClient.compileAnswers(answers));
        return this.messagingClient.runQuene().then(() => 'smallTalk.start');
      });
  },
  bulkPickup() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-bulk-pickup').then((answers) => {
        this.messagingClient.addAll(KitClient.compileAnswers(answers));
        return this.messagingClient.runQuene().then(() => 'smallTalk.start');
      });
  },
  electronicsDisposal() {
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-electronics-disposal').then((answers) => {
        this.messagingClient.addAll(KitClient.compileAnswers(answers));
        return this.messagingClient.runQuene().then(() => 'smallTalk.start');
      });
  },
};
