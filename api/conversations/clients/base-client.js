export default class BaseClient {
  constructor(config) {
    this.config = config;
    this.messageQuene = [];
    if (this.init) {
      this.init();
    }
  }

  isTyping() {
    // By default isn't used
    return new Promise((resolve) => { resolve(); });
  }

  end() {
    // For streaming type clients. Just HTTP for now.
    return new Promise((resolve) => { resolve(); });
  }

  send() {
    // To be overridden.
    return new Promise((resolve) => { resolve(); });
  }

  addToQuene(text, attachment, quickReplies) {
    // If has attachment, new message
    if (attachment) {
      this.messageQuene.push({
        constituent: this.config.constituent,
        text,
        attachment,
        quickReplies,
      });
      return;
    }
    // Make sure message is shorter than API's max length if it exists
    if (text && Object.prototype.hasOwnProperty.call(this.config, 'maxCharacters') && (text.length > this.config.maxCharacters)) {
      const sentences = text.split('.');
      let rebuiltSentence = '';
      sentences.forEach((sentence) => {
        if (rebuiltSentence.length + sentence.length < this.config.maxCharacters) {
          rebuiltSentence = rebuiltSentence.concat(`${sentence}.`);
        } else {
          this.messageQuene.push({
            constituent: this.config.constituent,
            rebuiltSentence,
          });
          rebuiltSentence = '';
        }
      });
    } else {
      this.messageQuene.push({
        constituent: this.config.constituent,
        text,
        quickReplies,
      });
    }
  }

  addAll(arr, quickReplies) {
    const self = this;
    if (!arr) return;
    arr.forEach((message, index, array) => {
      if (quickReplies && index + 1 === array.length) {
        self.addToQuene(message, quickReplies);
      } else {
        self.addToQuene(message);
      }
    });
  }

  runQuene() {
    const self = this;
    return new Promise((resolve, reject) => {
      function recursiveRun(quene) {
        if (quene.length === 0) {
          self.messageQuene = [];
          return resolve();
        }
        return self.send(quene[0].text, quene[0].attachment, quene[0].quickReplies).then(() => {
          return recursiveRun(quene.slice(1));
        }).catch(err => reject(err));
      }
      recursiveRun(self.messageQuene);
    });
  }
}
