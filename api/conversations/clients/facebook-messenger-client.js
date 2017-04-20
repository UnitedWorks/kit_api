import axios from 'axios';
import { logger } from '../../logger';
import BaseClient from './base-client';

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

  static configurePersistentMenu(pageToken, enable) {
    if (enable) {
      console.log('Enabling Persistent Menu');
      return axios.post(`https://graph.facebook.com/v2.6/me/messenger_profile?access_token=${pageToken}`, {
        persistent_menu: [{
          locale: 'en_US',
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
            payload: 'ASK_OPTIONS',
          }],
        }],
      }).then(data => data).catch(error => logger.error(error));
    }
    console.log('Disabling Persistent Menu');
    return axios.delete(`https://graph.facebook.com/v2.6/me/messenger_profile?access_token=${pageToken}`, {
      fields: ['persistent_menu'],
    }).then(data => data).catch(error => logger.error(error));
  }

  static configureStartingButton(pageToken, enable) {
    if (enable) {
      console.log('Enabling Starting Button');
      return axios.post(`https://graph.facebook.com/v2.6/me/messenger_profile?access_token=${pageToken}`, {
        get_started: {
          payload: 'GET_STARTED',
        }
      }).then(data => data).catch(error => logger.error(error));
    }
    console.log('Disabling Starting Button');
    return axios.delete(`https://graph.facebook.com/v2.6/me/messenger_profile?access_token=${pageToken}`, {
      fields: ['get_started'],
    }).then(data => data).catch(error => logger.error(error));
  }

  callAPI(messageData) {
    return new Promise((resolve, reject) => {
      const axiosInstance = axios.create();
      axiosInstance.post(`${this.config.graphURI}/v2.6/me/messages`, messageData, {
        params: {
          access_token: this.config.constituent.facebookEntry.access_token != null ? this.config.constituent.facebookEntry.access_token : this.config.pageToken,
        },
      }).then((response) => {
        logger.info('Successfully called Send API for recipient %s', response.data.recipient_id);
        resolve(response);
      }).catch((error) => {
        logger.error('Error thrown by axios', error.response.data);
        reject(error);
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

  send(content, quickActions) {
    if (!content) throw new Error('No content sent to Facebook Messenger interface');
    const sendData = {
      recipient: {
        id: this.config.constituent.facebook_id,
      },
      message: {},
    };
    if (typeof content === 'string') {
      if (content) sendData.message.text = content;
    } else if (typeof content === 'object' && content.type === 'template') {
      if (content.templateType === 'button') {
        sendData.message.attachment = {
          type: 'template',
          payload: {
            template_type: content.templateType,
            text: content.text,
            buttons: content.buttons,
          },
        };
      } else if (content.templateType === 'generic' || content.templateType === 'list') {
        sendData.message.attachment = {
          type: 'template',
          payload: {
            template_type: content.templateType,
            elements: content.elements,
          },
        };
        if (content.templateType === 'list' && content.buttons) {
          sendData.message.attachment.payload.buttons = content.buttons;
        }
      }
    } else {
      sendData.message.attachment = {
        type: content.type,
        payload: {
          url: content.url,
        },
      };
    }
    if (quickActions) sendData.message.quick_replies = quickActions;
    return new Promise((resolve) => {
      this.isTyping(false);
      this.callAPI(sendData).then(() => resolve());
    });
  }
}
