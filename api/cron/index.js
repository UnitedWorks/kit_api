import schedule from 'node-schedule';
import * as env from '../env';
import * as KNOWLEDGE_CONST from '../constants/knowledge-base';
import { nlp } from '../services/nlp';
import EmailService from '../services/email';
import { Feed } from '../feeds/models';
import { runWatcher } from '../feeds/helpers';
import { getCategoryFallback } from '../knowledge-base/helpers';

async function twitterFeeds() {
  const feeds = await Feed.where({ watcher: true }).fetchAll().then(f => f);
  // Run feeds
  const feedData = await Promise.all(feeds.toJSON().map(f => runWatcher(f))).then((data) => {
    const compiledData = [];
    data.forEach(tw => (compiledData.push(...tw)))
    return compiledData;
  });
  // On each response, check if there's something suggesting time/date change
  const alerts = await Promise.all(feedData.map((d) => {
    return nlp.message(d.text).then((witResponse) => {
      if (witResponse.entities.datetime) return d;
      return null;
    });
  })).then(a => a);
  // Group by organization
  const alertDeck = {};
  alerts.forEach((a) => {
    if (!alertDeck[a.organization_id]) alertDeck[a.organization_id] = [];
    alertDeck[a.organization_id].push(a);
  });
  // Email reps responsbile for the general category + link to FAQ page
  Object.keys(alertDeck).forEach((key) => {
    getCategoryFallback([KNOWLEDGE_CONST.GENERAL_LABEL], key).then((fb) => {
      new EmailService().send('🤖 Service Watcher Alert',
        `I noticed recent public updates were made mentioning dates/times. Please review to see if they affect any service answers:<br><br>${alertDeck[key].map(u => `<b>${u.text}</b> (<a href="${u.url}" target="_blank">${u.url})</a><br>`)}<br><br><a href="${env.getDashboardRoot()}/interfaces/faq?organization_id=${key}" target="_blank">Click here to review answers of common services</a> or <a href="${env.getDashboardRoot()}/interfaces/broadcasting?organization_id=${key}" target="_blank">click here to make a broadcast notification</a>.`,
        fb.representatives.map(r => ({ email: r.email, name: r.name })),
      );
    });
  });
}

export const watchers = () => {
  // Run Twitter Search Each Morning
  schedule.scheduleJob('* * 6 * * *', () => {
    twitterFeeds();
  });
};
