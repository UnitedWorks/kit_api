import axios from 'axios';
import { logger } from '../../logger';
import BaseClient from './base-client';

const defaultPersistentMenu = [{
  locale: 'default',
  call_to_actions: [{
    title: 'Quick Actions',
    type: 'nested',
    call_to_actions: [{
      title: 'Local Gov Services',
      type: 'nested',
      call_to_actions: [{
        type: 'postback',
        title: 'Get a Trash Schedule',
        payload: 'Get a Trash Schedule',
      }, {
        type: 'postback',
        title: 'Get a Pet License',
        payload: 'Get a Pet License',
      }, {
        type: 'postback',
        title: 'Check School Closure',
        payload: 'Check School Closure',
      }],
    }, {
      title: 'Raise an Issue',
      type: 'nested',
      call_to_actions: [{
        type: 'postback',
        title: 'Raise an Issue',
        payload: 'Raise an Issue',
      }, {
        type: 'postback',
        title: 'See My Requests',
        payload: 'See My Requests',
      }],
    }, {
      title: 'Voting and Elections',
      type: 'nested',
      call_to_actions: [{
        type: 'postback',
        title: 'Upcoming Elections',
        payload: 'Upcoming Elections',
      }, {
        type: 'postback',
        title: 'Register to Vote',
        payload: 'Register to Vote',
      }, {
        type: 'postback',
        title: 'Problem at Polls',
        payload: 'Problem at Polls',
      }],
    }, {
      title: 'Services and Benefits',
      type: 'nested',
      call_to_actions: [{
        type: 'postback',
        title: 'Benefits Screener',
        payload: 'Benefits Screener',
      }, {
        type: 'postback',
        title: 'Job Assistance',
        payload: 'Job Assistance',
      }, {
        type: 'postback',
        title: 'Find a Shelter',
        payload: 'Find a Shelter',
      }, {
        type: 'postback',
        title: 'Find a Washroom',
        payload: 'Find a Washroom',
      }],
    }],
  }, {
    title: 'Change Language',
    type: 'nested',
    call_to_actions: [{
      type: 'postback',
      title: 'Set English',
      payload: 'Set English',
    }, {
      type: 'postback',
      title: 'Set Espanol',
      payload: 'Set Espanol',
    }],
  }, {
    title: 'Help',
    payload: 'nested',
    call_to_actions: [{
      type: 'postback',
      title: 'What can I ask?',
      payload: 'What can I ask?',
    }, {
      type: 'postback',
      title: 'Leave Feedback',
      payload: 'Leave Feedback',
    }, {
      type: 'web_url',
      title: 'Want your own bot?',
      url: 'https://mayor.chat',
      webview_height_ratio: 'full',
    }],
  }],
}];

const gettingStarted = {
  payload: 'GET_STARTED',
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

  static configurePersistentMenu(pageToken, enable, menu = defaultPersistentMenu) {
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
