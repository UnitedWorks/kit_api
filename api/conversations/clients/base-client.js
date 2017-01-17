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
    // No messages? Just add
    const queneLength = this.messageQuene.length;
    if (queneLength === 0) {
      this.messageQuene.push({
        constituent,
        text,
      });
    }
    // If last message text appended with new message text, is > than maxCharacters. New message
    if (queneLength > 0) {
      if ((this.messageQuene[queneLength - 1].text.length + text.length) > this.config.maxCharacters) {
        this.messageQuene.push({
          constituent,
          text,
        });
      } else {
        // Otherwise, concat text.
        console.log(this.messageQuene[queneLength - 1].text.concat(` ${text}`))
        this.messageQuene[queneLength - 1].text = this.messageQuene[queneLength - 1].text.concat(` ${text}`);
      }
    }
  }

  runQuene() {
    const self = this;
    return new Promise((resolve, reject) => {
      function recursiveRun(quene) {
        if (quene.length === 0) {
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
