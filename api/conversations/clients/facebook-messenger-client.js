import axios from 'axios';
import { logger } from '../../logger';
import BaseClient from './base-client';
import { persistentMenu } from '../../narratives/machines/small-talk';

const gettingStarted = {
  payload: 'GET_STARTED',
};

function buttonTransforming(buttons) {
  return buttons.map((button) => {
    if (button.type === 'email') {
      return {
        type: 'web_url',
        title: button.title,
        url: `https://unitedworks.github.io/HeyEmail/?email=${button.email}`,
        webview_height_ratio: 'compact',
      };
    }
    return button;
  });
}

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

  static configurePersistentMenu(pageToken, enable, menu = persistentMenu) {
    if (enable) {
      logger.info('Enabling Persistent Menu');
      return axios.post(`https://graph.facebook.com/v2.6/me/messenger_profile?access_token=${pageToken}`, {
        persistent_menu: menu,
      }).then(data => data).catch(error => error);
    }
    logger.info('Disabling Persistent Menu');
    return axios.delete(`https://graph.facebook.com/v2.6/me/messenger_profile?access_token=${pageToken}`, {
      data: { fields: ['persistent_menu'] },
    }).then(data => data).catch(error => error);
  }

  // FYI, FB seemingly requires a Getting Started button
  // Error code: 2018145 =>
  // You must set a Get Started button if you also wish to use persistent menu.
  static configureStartingButton(pageToken, enable) {
    if (enable) {
      logger.info('Enabling Starting Button');
      return axios.post(`https://graph.facebook.com/v2.6/me/messenger_profile?access_token=${pageToken}`, {
        get_started: gettingStarted,
      }).then(data => data).catch(error => error);
    }
    logger.info('Disabling Starting Button');
    return axios.delete(`https://graph.facebook.com/v2.6/me/messenger_profile?access_token=${pageToken}`, {
      data: { fields: ['get_started'] },
    }).then(data => data).catch(error => error);
  }

  callAPI(messageData) {
    return new Promise((resolve, reject) => {
      const axiosInstance = axios.create();
      axiosInstance.post(`${this.config.graphURI}/v2.6/me/messages`, messageData, {
        params: {
          access_token: this.config.constituent.facebookEntry.access_token != null ?
            this.config.constituent.facebookEntry.access_token : this.config.pageToken,
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
    if (!content) {
      logger.error('No content sent');
      return new Promise(resolve => resolve());
    }
    const sendData = {
      recipient: {
        id: this.config.constituent.facebook_id,
      },
      message: {},
    };
    // Structure Message Data
    if (typeof content === 'string') {
      if (content) sendData.message.text = content;
    } else if (typeof content === 'object' && content.type === 'template') {
      if (content.templateType === 'button') {
        sendData.message.attachment = {
          type: 'template',
          payload: {
            template_type: content.templateType,
            text: content.text,
            buttons: buttonTransforming(content.buttons),
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
        if (content.templateType === 'generic') {
          sendData.message.attachment.payload.elements = content.elements.map(element => ({
            ...element,
            buttons: buttonTransforming(element.buttons),
          }));
        } else if (content.templateType === 'list' && content.buttons) {
          sendData.message.attachment.payload.buttons = buttonTransforming(content.buttons);
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
    if (quickActions && quickActions.length > 0) sendData.message.quick_replies = quickActions;
    return new Promise((resolve) => {
      this.isTyping(false);
      this.callAPI(sendData).then(() => resolve());
    });
  }
}
