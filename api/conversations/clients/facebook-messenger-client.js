import { logger } from '../../logger';
import BaseClient from './base-client';

const request = require('request');

export default class FacebookMessengerClient extends BaseClient {
  init() {
    const defaults = {
      verify_token: process.env.FB_VERIFY_TOKEN,
      page_token: process.env.FB_PAGE_TOKEN,
      app_secret: process.env.FB_APP_SECRET,
      graph_uri: 'https://graph.facebook.com',
    };

    this.config = Object.assign({}, defaults, this.config);
  }

  callAPI(messageData) {
    return new Promise((resolve, reject) => {
      request({
        uri: `${this.config.graph_uri}/v2.6/me/messages`,
        qs: { access_token: this.config.page_token },
        method: 'POST',
        json: messageData,
      }, (error, response, body) => {
        // this.isTyping(messageData.recipient.id, false);
        if (!error && !body.error) {
          logger.info('Successfully called Send API for recipient %s', body.recipient_id);
          resolve();
        } else {
          reject();
        }
      });
    });
  }

  isTyping(constituent, isTyping) {
    const sendData = {
      recipient: {
        id: constituent.facebook_id,
      },
      sender_action: isTyping ? 'typing_on' : 'typing_off',
    };
    this.callAPI(sendData);
  }

  send(constituent, text, attachment) {
    const sendData = {
      recipient: {
        id: constituent.facebook_id,
      },
      message: {},
    };

    if (text) {
      sendData.message.text = text;
    }

    if (attachment) {
      sendData.message.attachment = {
        type: attachment.type,
        url: attachment.url,
      };
    }

    return new Promise((resolve) => {
      const fakeTiming = text ? text.length * 60 : 800;
      this.isTyping(constituent, true);
      setTimeout(() => {
        this.callAPI(sendData).then(() => {
          this.isTyping(constituent, false);
          resolve();
        });
      }, fakeTiming);
    });
  }
}
