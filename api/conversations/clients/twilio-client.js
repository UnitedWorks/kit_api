import twilio from 'twilio';
import { logger } from '../../logger';
import BaseClient from './base-client';

export class TwilioSMSClient extends BaseClient {
  constructor(config) {
    super();
    const defaults = {
      sid: process.env.TWILIO_KEY_SID,
      secret: process.env.TWILIO_KEY_SECRET,
      fromNumber: process.env.TWILIO_FROM_NUMBER,
    };
    this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_ACCOUNT_AUTH_TOKEN);
    this.config = Object.assign({}, defaults, config, this.config);
  }

  send(content, quickActions) {
    return new Promise((resolve, reject) => {
      // Message
      const message = {
        to: this.config.constituent.phone,
        from: this.config.fromNumber,
        body: '',
      };
      if (typeof content === 'string') {
        message.body = content;
      } else if (content.templateType === 'button') {
        message.body = content.text;
        content.buttons.forEach((button) => {
          message.body = message.body.concat(`\r${button.title}: ${button.payload}`);
        });
      } else if (content.templateType === 'generic') {
        content.elements.forEach((element) => {
          message.body = message.body.concat(`${element.title}`);
          if (element.subtitle) message.body = message.body.concat(` -- ${element.subtitle}`);
          if (element.default_action) message.body = message.body.concat(` (${element.default_action.url})`);
          element.buttons.forEach((button) => {
            if (button.url) {
              message.body = message.body.concat(` ${button.title}(${button.url})`);
            }
          });
        });
      } else if (content.templateType === 'list') {
        content.elements.forEach((element) => {
          message.body = message.body.concat(`${element.title}`);
          if (element.subtitle) message.body = message.body.concat(` -- ${element.subtitle}`);
          message.body = message.body.concat('\r');
        });
        content.buttons.forEach((button) => {
          message.body = message.body.concat(`\n(${button.title}: ${button.url})`);
        });
      } else if (content.type === 'image') {
        message.mediaUrl = content.url;
      }
      // Append Quick Actions
      if (quickActions) {
        message.body = message.body.concat('\rQuick Replies: ');
        quickActions.forEach((reply, index) => {
          message.body = message.body.concat(index === 0 ? reply.title : `, ${reply.title}`);
        });
      }
      // Send
      this.client.messages.post(message, (err, response) => {
        if (err) reject(err);
        resolve(response);
      });
    });
  }
}
