import axios from 'axios';
import { logger } from '../../logger';
import BaseClient from './base-client';

const persistentMenu = {
  setting_type: 'call_to_actions',
  thread_state: 'existing_thread',
  call_to_actions: [{
    type: 'postback',
    title: 'Make a Request / Complaint',
    payload: 'MAKE_REQUEST',
  }, {
    type: 'postback',
    title: 'My Requests',
    payload: 'GET_REQUESTS',
  }, {
    type: 'postback',
    title: 'Change my city',
    payload: 'CHANGE_CITY',
  }, {
    type: 'postback',
    title: 'What can I ask?',
    payload: 'WHAT_CAN_I_ASK',
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
    .catch(error => logger.error(error));
  // Send FB the getting started settings for the sake of it
  axios.post(`https://graph.facebook.com/v2.6/me/thread_settings?access_token=${process.env.FB_PAGE_TOKEN}`, startingMenu)
    .catch(error => logger.error(error));
};

export class FacebookMessengerClient extends BaseClient {
  constructor(config) {
    super();
    const defaults = {
      verifyToken: process.env.FB_VERIFY_TOKEN,
      pageToken: process.env.FB_PAGE_TOKEN,
      appSecret: process.env.FB_APP_SECRET,
      graphURI: 'https://graph.facebook.com',
      maxCharacters: 640,
    };
    this.config = Object.assign({}, defaults, config, this.config);
  }

  callAPI(messageData) {
    return new Promise((resolve, reject) => {
      const axiosInstance = axios.create();
      axiosInstance.defaults.headers.post = { 'Content-Type': 'application/json' };
      axiosInstance.defaults.headers.put = { 'Content-Type': 'application/json' };
      axiosInstance.defaults.headers.patch = { 'Content-Type': 'application/json' };
      axiosInstance.post(`${this.config.graphURI}/v2.6/me/messages`, messageData, {
        params: {
          access_token: this.config.pageToken,
        },
      }).then((response) => {
        logger.info('Successfully called Send API for recipient %s', response.data.recipient_id);
        resolve(response);
      }).catch((err) => {
        logger.error(`${err}`);
        reject(err);
      });
    });
  }

  isTyping(isTyping) {
    const sendData = {
      recipient: {
        id: this.config.constituent.facebook_id,
      },
      sender_action: isTyping ? 'typing_on' : 'typing_off',
    };
    return this.callAPI(sendData);
  }

  send(text, attachment, quickActions) {
    const sendData = {
      recipient: {
        id: this.config.constituent.facebook_id,
      },
      message: {},
    };
    // Handle templates differently than text, images, and quick replies
    if (attachment && attachment.type === 'template') {
      if (attachment.templateType === 'button') {
        sendData.message.attachment = {
          type: 'template',
          payload: {
            template_type: attachment.templateType,
            text,
            buttons: quickActions,
          },
        };
      } else if (attachment.templateType === 'generic') {
        sendData.message.attachment = {
          type: 'template',
          payload: {
            template_type: attachment.templateType,
            elements: attachment.elements,
          },
        };
      }
    } else {
      if (text) sendData.message.text = text;
      if (attachment) {
        sendData.message.attachment = {
          type: attachment.type,
          payload: {
            url: attachment.url,
          },
        };
      }
      if (quickActions) {
        sendData.message.quick_replies = quickActions;
      }
    }

    return new Promise((resolve) => {
      this.isTyping(false);
      this.callAPI(sendData).then(() => resolve());
    });
  }
}
