import axios from 'axios';
import { logger } from '../../logger';
import BaseClient from './base-client';

const defaultPersistentMenu = [{
  locale: 'default',
  call_to_actions: [{
    title: '🔦 Quick Questions',
    type: 'nested',
    call_to_actions: [{
      title: '📍 Common Questions',
      type: 'nested',
      call_to_actions: [{
        type: 'postback',
        title: 'Get Trash Schedule',
        payload: 'Get Trash Schedule',
      }, {
        type: 'postback',
        title: 'Get Recycling Schedule',
        payload: 'Get Recycling Schedule',
      }, {
        type: 'postback',
        title: 'Get Parking Schedule',
        payload: 'Get Parking Schedule',
      }, {
        type: 'postback',
        title: 'Are Schools Open Tomorrow?',
        payload: 'Are Schools Open Tomorrow?',
      }, {
        type: 'postback',
        title: 'Deadlines I Should Know Of',
        payload: 'Deadlines I Should Know Of',
      }],
    }, {
      title: '🚨 Local Gov Services',
      type: 'nested',
      call_to_actions: [{
        type: 'postback',
        title: 'Upcoming Town Meetings',
        payload: 'Upcoming Town Meetings',
      }, {
        type: 'postback',
        title: 'When Are Taxes Due?',
        payload: 'When Are Taxes Due?',
      }, {
        type: 'postback',
        title: 'Get Marriage Certificate Copy',
        payload: 'Get Marriage Certificate Copy',
      }, {
        type: 'postback',
        title: 'Get Pet License',
        payload: 'Get Pet License',
      }, {
        type: 'postback',
        title: 'Get Copy of a Deed',
        payload: 'Get Copy of a Deed',
      }],
    }, {
      title: '📅 Voting and Elections',
      type: 'nested',
      call_to_actions: [{
        type: 'postback',
        title: 'Upcoming Elections',
        payload: 'Upcoming Elections',
      }, {
        type: 'postback',
        title: 'Register to Vote',
        payload: 'Register To Vote',
      }, {
        type: 'postback',
        title: 'Voter ID Requirements',
        payload: 'Voter ID Requirements',
      }, {
        type: 'postback',
        title: 'Early Voting Rules',
        payload: 'Early Voting Rules',
      }, {
        type: 'postback',
        title: 'Problem at Polls',
        payload: 'Problem At Polls',
      }],
    }, {
      title: '🔔 Employment and Benefits',
      type: 'nested',
      call_to_actions: [{
        type: 'postback',
        title: 'Benefits Screener',
        payload: 'Benefits Screener',
      }, {
        type: 'postback',
        title: 'Report Wage Theft',
        payload: 'Report Wage Theft',
      }, {
        type: 'postback',
        title: 'Job Assistance',
        payload: 'Job Assistance',
      }],
    }, {
      title: '❤️ Immediate Assistance',
      type: 'nested',
      call_to_actions: [{
        type: 'postback',
        title: 'Find a Shelter',
        payload: 'Find a Shelter',
      }, {
        type: 'postback',
        title: 'Find Health Clinic',
        payload: 'Find Health Clinic',
      }, {
        type: 'postback',
        title: 'Find a Washroom',
        payload: 'Find a Washroom',
      }],
    }],
  }, {
    title: '🎯 Quick Actions',
    type: 'nested',
    call_to_actions: [{
      title: '🔨 Report a Problem',
      type: 'nested',
      call_to_actions: [{
        type: 'postback',
        title: 'Report Pothole',
        payload: 'Report Pothole',
      }, {
        type: 'postback',
        title: 'Report Broken Sidewalk',
        payload: 'Report Broken Sidewalk',
      }, {
        type: 'postback',
        title: 'Report Broken Sign',
        payload: 'Report Broken Sign',
      }, {
        type: 'postback',
        title: 'Report Light Outage',
        payload: 'Report Light Outage',
      }, {
        type: 'postback',
        title: 'Report General Problem',
        payload: 'Report General Problem',
      }],
    }, {
      title: '🔧 Request a Service',
      type: 'nested',
      call_to_actions: [{
        type: 'postback',
        title: 'Request Bulk Pickup',
        payload: 'Request Bulk Pickup'
      }, {
        type: 'postback',
        title: 'Request Parking Permit',
        payload: 'Request Parking Permit'
      }, {
        type: 'postback',
        title: 'Request Disability Tags',
        payload: 'Request Disability Tags'
      }, {
        type: 'postback',
        title: 'Request Building Inspection',
        payload: 'Request Building Inspection'
      }, {
        type: 'postback',
        title: 'Request Fire Inspection',
        payload: 'Request Fire Inspection'
      }],
    }, {
      type: 'postback',
      title: '📥 View My Requests',
      payload: 'GET_REQUESTS',
    }],
  }, {
    title: '🔮 Help',
    type: 'nested',
    call_to_actions: [{
      type: 'postback',
      title: 'What can I ask?',
      payload: 'What can I ask?',
    }, {
      title: 'Language',
      type: 'nested',
      call_to_actions: [{
        type: 'postback',
        title: 'Change language to English',
        payload: 'Change language to English',
      }, {
        type: 'postback',
        title: 'Cambiar el idioma al Espanol',
        payload: 'Change Language To Espanol',
      }],
    }, {
      type: 'postback',
      title: 'Leave Feedback',
      payload: 'Leave Feedback',
    }, {
      type: 'web_url',
      title: 'Want your own bot?',
      url: 'https://mayor.chat',
      webview_height_ratio: 'tall',
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
    if (quickActions && quickActions.length > 0) sendData.message.quick_replies = quickActions;
    return new Promise((resolve) => {
      this.isTyping(false);
      this.callAPI(sendData).then(() => resolve());
    });
  }
}
