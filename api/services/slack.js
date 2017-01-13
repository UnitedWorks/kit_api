import axios from 'axios';
import * as environments from '../constants/environments';
import * as env from '../env';

export default class SlackService {

  constructor(payload = {}, webhook) {
    this.webhook = webhook || process.env.SLACK_ALERT_COMMUNITY_WEBOOK;
    this.payload = {
      channel: payload.channel || process.env.SLACK_ALERT_COMMUNITY_CHANNEL,
      username: env.get() === environments.PRODUCTION ? payload.username || 'Constituent Complaint' : 'Local Environment Complaint',
      icon_emoji: env.get() === environments.PRODUCTION ? payload.icon_emoji || ':rage:' : ':wrench:',
    };
  }

  send(text) {
    this.payload.text = text;
    if (env.get() !== environments.TEST) {
      axios.post(this.webhook, this.payload);
    }
  }

}
