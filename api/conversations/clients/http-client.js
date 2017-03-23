import { logger } from '../../logger';
import BaseClient from './base-client';

/* TODO(nicksahler): Long polling */
export class HTTPClient extends BaseClient {
  constructor(config) {
    super();
    this.config = Object.assign({}, config);
    this.messages = [];
  }

  send(content, quickActions) {
    return new Promise((resolve, reject)=>{
      this.messages.push({ content, quickActions })
      resolve();
    });
  }

  end() {
    this.config.res.send(this.messages);
  }
}
