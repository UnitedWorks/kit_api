import { logger } from '../../logger';

export default class BaseClient {
  constructor(config) {
    this.config = config;
    this.messageQuene = [];
    if (this.init) {
      this.init();
    }
  }

  addToQuene(constituent, text, attachment) {
    // If has attachment, new message
    if (attachment) {
      this.messageQuene.push({
        constituent,
        text,
        attachment,
      });
      return;
    }
    // Make sure message is shorter than API's max length if it exists
    if (Object.prototype.hasOwnProperty.call(this.config, 'maxCharacters') && (text.length > this.config.maxCharacters)) {
      const sentences = text.split('.');
      let rebuiltSentence = '';
      sentences.forEach((sentence) => {
        if (rebuiltSentence.length + sentence.length < this.config.maxCharacters) {
          rebuiltSentence = rebuiltSentence.concat(`${sentence}.`);
        } else {
          this.messageQuene.push({
            constituent,
            rebuiltSentence,
          });
          rebuiltSentence = '';
        }
      });
    } else {
      this.messageQuene.push({
        constituent,
        text,
      });
    }
  }

  runQuene() {
    const self = this;
    return new Promise((resolve, reject) => {
      function recursiveRun(quene) {
        if (quene.length === 0) {
          self.messageQuene = [];
          return resolve();
        }
        return self.send(quene[0].constituent, quene[0].text, quene[0].attachment).then(() => {
          return recursiveRun(quene.slice(1));
        });
      }
      recursiveRun(self.messageQuene);
    });
  }
}
