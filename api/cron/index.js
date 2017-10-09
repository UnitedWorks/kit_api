import schedule from 'node-schedule';
import * as env from '../env';
import * as KNOWLEDGE_CONST from '../constants/knowledge-base';
import * as FEED_CONST from '../constants/feeds';
import { logger } from '../logger';
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
  // On each response, check for entities
  const alerts = await Promise.all(feedData.map(d => nlp.message(d.text).then((wit) => {
    // Check for watcher => schedule change
    if (wit.entities.watchers) {
      return wit.entities.watchers.filter(w =>
        w.value === FEED_CONST.ALERTS_SCHEDULE_CHANGE).length > 0 ? d : null;
    }
  }))).then(filtered => filtered.filter(a => a));
  // Group by organization
  const alertDeck = {};
  alerts.forEach((a) => {
    if (!alertDeck[a.organization_id]) alertDeck[a.organization_id] = [];
    alertDeck[a.organization_id].push(a);
  });
  // Email reps responsbile for the general category + link to FAQ page
  Object.keys(alertDeck).forEach((key) => {
    getCategoryFallback([KNOWLEDGE_CONST.GENERAL_LABEL], key).then((fb) => {
      new EmailService().send('🤖 Service Change Watcher',
        `Some recent public updates mentioned cancellations/rescheduling. Please review <a href="${env.getDashboardRoot()}/faq?organization_id=${key}" target="_blank">common service answers</a> or <a href="${env.getDashboardRoot()}/broadcasting?organization_id=${key}" target="_blank">broadcast a message</a>:<br><br>${alertDeck[key].map(u => `<b>${u.text}</b> (<a href="${u.url}" target="_blank">${u.url})</a><br>`)}`,
        fb.representatives.map(r => ({ email: r.email, name: r.name })),
      );
    }).catch(err => logger.error(err));
  });
}

export const watchers = () => {
  // Run Twitter Search Each Morning
  schedule.scheduleJob('0 30 12 * * *', () => {
    twitterFeeds();
  });
};
