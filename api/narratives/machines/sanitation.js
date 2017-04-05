import KitClient from '../clients/kit-client';
import { entityValueIs } from '../helpers';
import * as TAGS from '../../constants/nlp-tagging';

export default {
  garbageSchedule() {
    if (!this.get('organization')) return this.stateRedirect('location', 'sanitation.garbageSchedule');
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-garbage-schedule').then((answers) => {
        if (this.get('nlp')[TAGS.DATETIME]) {
          this.messagingClient.addAll(KitClient.dynamicAnswer(answers, this.get('nlp')[TAGS.DATETIME]));
        } else if (entityValueIs(this.get('nlp')[TAGS.SCHEDULES], [TAGS.DAYS, TAGS.SCHEDULES])) {
          this.messagingClient.addAll(KitClient.dynamicAnswer(answers));
        } else {
          this.messagingClient.addAll(KitClient.staticAnswer(answers));
        }
        return this.messagingClient.runQuene().then(() => 'smallTalk.start');
      });
  },
  garbageDropOff() {
    if (!this.get('organization')) return this.stateRedirect('location', 'sanitation.garbageDropOff');
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-garbage-drop-off').then((answers) => {
        this.messagingClient.addAll(KitClient.staticAnswer(answers));
        return this.messagingClient.runQuene().then(() => 'smallTalk.start');
      });
  },
  recyclingSchedule() {
    if (!this.get('organization')) return this.stateRedirect('location', 'sanitation.recyclingSchedule');
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-recycling-schedule').then((answers) => {
        if (this.get('nlp')[TAGS.DATETIME]) {
          this.messagingClient.addAll(KitClient.dynamicAnswer(answers, this.get('nlp')[TAGS.DATETIME]));
        } else if (this.get('nlp')[TAGS.DATETIME]) {
          this.messagingClient.addAll(KitClient.dynamicAnswer(answers));
        } else {
          this.messagingClient.addAll(KitClient.staticAnswer(answers));
        }
        return this.messagingClient.runQuene().then(() => 'smallTalk.start');
      });
  },
  recyclingDropOff() {
    if (!this.get('organization')) return this.stateRedirect('location', 'sanitation.recyclingDropOff');
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-recycling-drop-off').then((answers) => {
        this.messagingClient.addAll(KitClient.staticAnswer(answers));
        return this.messagingClient.runQuene().then(() => 'smallTalk.start');
      });
  },
  compostDumping() {
    if (!this.get('organization')) return this.stateRedirect('location', 'sanitation.compostDumping');
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-compost').then((answers) => {
        if (this.get('nlp')[TAGS.DATETIME]) {
          this.messagingClient.addAll(KitClient.dynamicAnswer(answers, this.get('nlp')[TAGS.DATETIME]));
        } else if (entityValueIs(this.get('nlp')[TAGS.SCHEDULES], [TAGS.DAYS, TAGS.SCHEDULES])) {
          this.messagingClient.addAll(KitClient.dynamicAnswer(answers));
        } else {
          this.messagingClient.addAll(KitClient.staticAnswer(answers));
        }
        return this.messagingClient.runQuene().then(() => 'smallTalk.start');
      });
  },
  bulkPickup() {
    if (!this.get('organization')) return this.stateRedirect('location', 'sanitation.bulkPickup');
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-bulk-pickup').then((answers) => {
        this.messagingClient.addAll(KitClient.staticAnswer(answers));
        return this.messagingClient.runQuene().then(() => 'smallTalk.start');
      });
  },
  electronicsDisposal() {
    if (!this.get('organization')) return this.stateRedirect('location', 'sanitation.electronicsDisposal');
    return new KitClient({ organization: this.get('organization') })
      .getAnswer('sanitation-electronics-disposal').then((answers) => {
        this.messagingClient.addAll(KitClient.staticAnswer(answers));
        return this.messagingClient.runQuene().then(() => 'smallTalk.start');
      });
  },
};
