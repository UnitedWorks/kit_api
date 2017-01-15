import twilio from 'twilio';
import { logger } from '../../logger';
import BaseClient from './base-client';

export class TwilioSMSClient extends BaseClient {
  init() {
    const defaults = {
      sid: process.env.TWILIO_KEY_SID,
      secret: process.env.TWILIO_KEY_SECRET,
      fromNumber: process.env.TWILIO_FROM_NUMBER,
    };
    this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_ACCOUNT_AUTH_TOKEN);
    this.config = Object.assign({}, defaults, this.config);
  }

  send(constituent, text) {
    return new Promise((resolve, reject) => {
      this.client.messages.post({
        to: constituent.phone,
        from: this.config.fromNumber,
        body: text,
      }, (err, response) => {
        if (err) {
          logger.info(err);
          reject(err);
        }
        resolve(response);
      });
    });
  }
}
