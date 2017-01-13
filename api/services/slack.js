import axios from 'axios';
import * as environments from '../constants/environments';

export default class SlackService {

  constructor(payload = {}, webhook) {
    this.webhook = webhook || process.env.SLACK_ALERT_COMMUNITY_WEBOOK;
    this.payload = {
      channel: payload.channel || process.env.SLACK_ALERT_COMMUNITY_CHANNEL,
      text: payload.text || '',
      username: process.env.NODE_ENVIRONMENT === environments.PRODUCTION ? payload.username || 'Constituent Complaint' : 'Local Environment Complaint',
      icon_emoji: process.env.NODE_ENVIRONMENT === environments.PRODUCTION ? payload.icon_emoji || ':capitol:' : ':wrench:',
    };
  }

  send(text) {
    this.payload.text = text;
    if (process.env.NODE_ENVIRONMENT !== environments.TEST) {
      axios.post(this.webhook, this.payload);
    }
  }

}
