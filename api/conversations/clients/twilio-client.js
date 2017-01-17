import twilio from 'twilio';
import { logger } from '../../logger';
import BaseClient from './base-client';

export class TwilioSMSClient extends BaseClient {
  constructor() {
    super();
    const defaults = {
      sid: process.env.TWILIO_KEY_SID,
      secret: process.env.TWILIO_KEY_SECRET,
      fromNumber: process.env.TWILIO_FROM_NUMBER,
      maxCharacters: 160,
    };
    this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_ACCOUNT_AUTH_TOKEN);
    this.config = Object.assign({}, defaults, this.config);
  }

  send(constituent, text, attachment) {
    return new Promise((resolve, reject) => {
      const message = {
        to: constituent.phone,
        from: this.config.fromNumber,
        body: text,
      };
      if (attachment) {
        message.mediaUrl = attachment.url;
      }
      let fakeTiming = text ? text.length * 60 : 800;
      if (fakeTiming > 2000) fakeTiming = 2000;
      setTimeout(() => {
        this.client.messages.post(message, (err, response) => {
          if (err) {
            logger.info(err);
            reject(err);
          }
          resolve(response);
        });
      }, fakeTiming);
    });
  }
}
