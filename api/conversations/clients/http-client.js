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
    this.config.res.send({
      meta: {
        constituent_id: this.config.constituent.id,
      },
      messages: this.messages,
    });
  }
}
