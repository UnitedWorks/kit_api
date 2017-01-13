import axios from 'axios';
import { logger } from '../../logger';
import BaseClient from './base-client';

const persistentMenu = {
  setting_type: 'call_to_actions',
  thread_state: 'existing_thread',
  call_to_actions: [{
    type: 'postback',
    title: 'Make a Complaint',
    payload: 'MAKE_COMPLAINT',
  }, {
    type: 'postback',
    title: 'Change my city',
    payload: 'CHANGE_CITY',
  }, {
    type: 'postback',
    title: 'Register my city',
    payload: 'REGISTER_YOUR_CITY',
  }],
};

const startingMenu = {
  setting_type: 'call_to_actions',
  thread_state: 'new_thread',
  call_to_actions: [{
    payload: 'GET_STARTED',
  }],
};

export const configureExternalInterfaces = () => {
  // Send FB the persistent menu settings for the sake of it
  axios.post(`https://graph.facebook.com/v2.6/me/thread_settings?access_token=${process.env.FB_PAGE_TOKEN}`, persistentMenu)
    .catch((error) => {
      if (error) logger.info(error);
    });
  // Send FB the getting started settings for the sake of it
  axios.post(`https://graph.facebook.com/v2.6/me/thread_settings?access_token=${process.env.FB_PAGE_TOKEN}`, startingMenu)
    .catch((error) => {
      if (error) logger.info(error);
    });
};

export class FacebookMessengerClient extends BaseClient {
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
      axios.post(`${this.config.graph_uri}/v2.6/me/messages`, messageData, {
        params: {
          access_token: this.config.page_token,
        },
      }).then((response) => {
        // this.isTyping(messageData.recipient.id, false);
        logger.info('Successfully called Send API for recipient %s', response.data.recipient_id);
        resolve();
      }).catch(() => {
        reject();
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
      let fakeTiming = text ? text.length * 60 : 800;
      if (fakeTiming > 2000) fakeTiming = 2000;
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
