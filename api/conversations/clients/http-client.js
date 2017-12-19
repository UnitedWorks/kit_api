import { logger } from '../../logger';
import BaseClient from './base-client';
import * as interfaces from '../../constants/interfaces';

/* TODO(nicksahler): Long polling */
export class HTTPClient extends BaseClient {
  constructor(config) {
    super();
    this.config = Object.assign({}, config);
    this.provider = interfaces.HTTP;
    this.messages = [];
  }

  send(content, quickActions) {
    return new Promise((resolve, reject) => {
      this.messages.push({ content, quickActions })
      resolve();
    });
  }

  end() {
    if (!this.messages || this.messages.length === 0) return;
    this.config.res.send({
      meta: {
        constituent_id: this.config.constituent.id,
      },
      messages: this.messages,
    });
  }

  runQuene() {
    const self = this;
    return new Promise((resolve, reject) => {
      function recursiveRun(quene) {
        if (quene.length === 0) {
          self.messageQuene = [];
          return resolve(self.end());
        } else if (!quene[0] || (!quene[0].text && !quene[0].attachment)) {
          return recursiveRun(quene.slice(1));
        } else {
          self.messages.push({
            content: quene[0].text,
            quickActions: quene[0].attachment,
          });
          return recursiveRun(quene.slice(1));
        }
      }
      recursiveRun(self.messageQuene);
    });
  }
}
