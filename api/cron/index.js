import moment from 'moment';
import schedule from 'node-schedule';
import * as ORG_CONST from '../constants/organizations';
import * as FEED_CONST from '../constants/feeds';
import { nlp } from '../utils/nlp';
import { Feed } from '../feeds/models';
import { runWatcher, runFeed } from '../feeds/helpers';
import { getAnswers } from '../knowledge-base/helpers';
import { NarrativeSession } from '../narratives/models';
import { getPreferredClient } from '../conversations/helpers';
import KitClient from '../narratives/clients/kit-client';
import WeatherClient from '../narratives/clients/weather-client';
import * as QUICK_REPLIES from '../narratives/templates/quick-replies';
import { Organization } from '../accounts/models';

async function todaysAlerts() {
  const feeds = await Feed.where({ watcher: true }).fetchAll().then(f => f);
  // Run feeds
  const feedData = await Promise.all(feeds.toJSON().map(f => runWatcher(f))).then((data) => {
    const compiledData = [];
    data.forEach(tw => (compiledData.push(...tw)));
    return compiledData;
  });
  // On each response, check for entities
  const alerts = await Promise.all(feedData.map(d => nlp.message(d.text).then((wit) => {
    // Check for watcher => schedule change
    const alertEntities = wit.entities.watchers ? wit.entities.watchers.filter(w =>
      w.value === FEED_CONST.ALERTS_SCHEDULE_CHANGE ||
      w.value === FEED_CONST.ALERTS_DELAYS) : [];
    if (alertEntities.length > 0) {
      if (alertEntities[0].value === FEED_CONST.ALERTS_DELAYS) {
        return { ...d, type: FEED_CONST.ALERTS_DELAYS };
      } else if (alertEntities[0].value === FEED_CONST.ALERTS_SCHEDULE_CHANGE) {
        return { ...d, type: FEED_CONST.ALERTS_SCHEDULE_CHANGE };
      }
    }
  }))).then(filtered => filtered.filter(a => a));
  // Group by organization
  const alertDeck = {};
  alerts.forEach((a) => {
    if (!alertDeck[a.organization_id]) alertDeck[a.organization_id] = [];
    alertDeck[a.organization_id].push(a);
  });
  return alertDeck;
}

async function todaysEvents() {
  const feeds = await Feed.where({ watcher: false }).fetchAll().then(f => f);
  const feedEvents = await Promise.all(feeds.toJSON().filter(f => f.entity === 'event').map(feed => runFeed(feed))).then((fResults) => {
    let events = [];
    fResults.forEach(r => (events = events.concat(r.events)));
    return events;
  });
  const eventDeck = {};
  feedEvents.filter(e => e.organization_id).forEach((e) => {
    if (!eventDeck[e.organization_id]) eventDeck[e.organization_id] = [];
    // If passes check, push
    const diff = moment(new Date(e.availabilitys[0].t_start)).diff(moment(), 'h');
    const passes = diff <= 42 && diff > -4;
    if (passes) eventDeck[e.organization_id].push(e);
  });
  return eventDeck;
}

export async function todaysForecast() {
  const organizations = await Organization.where({ parent_organization_id: null }).fetchAll({ withRelated: ['address'] }).then(o => o.toJSON());
  const weatherDeck = {};
  for (let i = 0; i < organizations.length; i += 1) {
    if (organizations[i].address) {
      weatherDeck[organizations[i].id] = await new WeatherClient().dayForecast(
        organizations[i].address.location.coordinates[0], organizations[i].address.location.coordinates[1]).then(f => f);
    }
  }
  return weatherDeck;
}

export function scheduledJobs() {
  // Constituent Notification Signup
  // Default: 0 15 13 27 * *
  // schedule.scheduleJob('0 15 13 27 * *', () => {
  //   NarrativeSession.fetchAll({ withRelated: ['constituent', 'constituent.facebookEntry', 'constituent.smsEntry', 'organization'] })
  //     .then((s) => {
  //       s.toJSON().filter(session => session.organization &&
  //         session.organization.type === ORG_CONST.GOVERNMENT)
  //         .forEach((session) => {
  //           const client = getPreferredClient(session.constituent);
  //           if (client && !session.data_store.notifications) {
  //             client.send(
  //               'Would you like reminders about trash/recycling collection, big city events, and the weather?',
  //               [QUICK_REPLIES.allNotificationsOn, QUICK_REPLIES.allNotificationsOff]);
  //           }
  //         });
  //     });
  // });

  // Constituent Notification: Morning - Weather, Events, Alerts
  // Default: 0 0 13 * * *
  schedule.scheduleJob('0 0 13 * * *', () => {
    NarrativeSession.fetchAll({ withRelated: ['constituent', 'constituent.facebookEntry', 'constituent.smsEntry', 'organization'] }).then((s) => {
      todaysForecast().then((forecast) => {
        todaysEvents().then((events) => {
          todaysAlerts().then((alerts) => {
            // Run Notifciation on Sessions
            const sessions = s.toJSON().filter(session => session.organization
              && session.organization.type === ORG_CONST.GOVERNMENT
              && session.organization.parent_organization_id == null);
            sessions.forEach((session) => {
              const quickReplies = [];
              const client = getPreferredClient(session.constituent);
              if (client == null || !session.data_store.notifications) return;
              // Weather
              // if (session.data_store.notifications.weather && forecast[session.organization_id]) {
              //   quickReplies.push(QUICK_REPLIES.weatherOff);
              //   client.addToQuene(`${WeatherClient.emojiMap[forecast[session.organization_id].weather.id] || ''} Looks like today will have a low of ${forecast[session.organization_id].min}° and a high of ${forecast[session.organization_id].max}°${forecast[session.organization_id].weather.description ? ` with ${forecast[session.organization_id].weather.description}.` : ''}`, quickReplies);
              // } else if (session.data_store.notifications.weather === false) {
              //   quickReplies.push(QUICK_REPLIES.weatherOn);
              // }
              // Events
              if (session.data_store.notifications.events && events[session.organization_id]
                && events[session.organization_id].length > 0) {
                quickReplies.push(QUICK_REPLIES.eventsOff);
                client.addToQuene('📅 You have local events coming up!');
                client.addAll(KitClient.genericTemplateFromEntities(
                  events[session.organization_id].map(event => ({ type: 'event', payload: event }))),
                  quickReplies);
              } else if (session.data_store.notifications.events === false) {
                quickReplies.push(QUICK_REPLIES.eventsOn);
              }
              // Alerts
              if (session.data_store.notifications.alerts && alerts[session.organization_id]
                && alerts[session.organization_id].length > 0) {
                quickReplies.push(QUICK_REPLIES.alertsOff);
                const alertsMessage = alerts[session.organization_id].map(u => `"${u.text.length > 40 ? `${u.text.slice(0, 40)}...` : u.text}"(${u.url}) `);
                client.addToQuene(`🚨 Notices that may impact your day: ${alertsMessage}`, quickReplies);
              } else if (session.data_store.notifications.alerts === false) {
                quickReplies.push(QUICK_REPLIES.alertsOn);
              }
              client.runQuene();
            });
          });
        });
      });
    });
  });

  // Constituent Notification: Evening - Services
  schedule.scheduleJob('0 30 22 * * *', () => {
    NarrativeSession.fetchAll({ withRelated: ['organization', 'constituent', 'constituent.facebookEntry', 'constituent.smsEntry'] }).then((s) => {
      // Get sanitation answers for each org
      const sessions = s.toJSON().filter(session => session.organization
        && session.organization.type === ORG_CONST.GOVERNMENT
        && session.organization.parent_organization_id == null);
      Promise.all([...new Set(sessions.map(session => session.organization_id))].map((orgId) => {
        return getAnswers({ organization_id: orgId, label: 'environment_sanitation.recycling.schedule' }, { answerGrouped: true, returnJSON: true }).then((recyclingCluster) => {
          return getAnswers({ organization_id: orgId, label: 'environment_sanitation.trash.schedule' }, { answerGrouped: true, returnJSON: true }).then((trashCluster) => {
            if (trashCluster.answers.length === 0 &&
              recyclingCluster.answers.length === 0) return null;
            const answerCluster = {};
            if (trashCluster.answers.filter(a => a.service)) {
              if (Object.keys(answerCluster).length === 0) answerCluster[orgId] = {};
              answerCluster[orgId].trash = trashCluster.answers.filter(a => a.service_id);
              if (answerCluster[orgId].trash.length === 1) {
                answerCluster[orgId].trash = answerCluster[orgId].trash[0].service;
              } else {
                answerCluster[orgId].trash = null;
              }
            }
            if (recyclingCluster.answers.filter(a => a.service)) {
              if (Object.keys(answerCluster).length === 0) answerCluster[orgId] = {};
              answerCluster[orgId].recycling = recyclingCluster.answers.filter(a => a.service_id);
              if (answerCluster[orgId].recycling.length === 1) {
                answerCluster[orgId].recycling = answerCluster[orgId].recycling[0].service;
              } else {
                answerCluster[orgId].recycling = null;
              }
            }
            if (Object.keys(answerCluster).length > 0) return answerCluster;
          });
        });
      })).then((answerClusters) => {
        const orgAnswerSet = {};
        answerClusters.filter(c => c).forEach(cluster =>
          (orgAnswerSet[Object.keys(cluster)[0]] = cluster[Object.keys(cluster)[0]]));
        // Run Notifciation on Sessions
        sessions.forEach((session) => {
          // Check if org even has answers
          if (orgAnswerSet.hasOwnProperty(session.organization_id)) {
            if (session.data_store && !session.data_store.notifications) session.data_store.notifications = {};
            const tomorrow = moment().add(1, 'days').utc().format();
            let hasRecycling = false;
            let hasTrash = false;
            if (orgAnswerSet[session.organization_id].recycling && orgAnswerSet[session.organization_id].recycling) {
              hasRecycling = KitClient.entityAvailability('service', orgAnswerSet[session.organization_id].recycling, {
                datetime: [{ grain: 'day', value: tomorrow }],
                constituentAttributes: session.data_store.attributes,
              }, { toText: false });
            }
            if (orgAnswerSet[session.organization_id].trash && orgAnswerSet[session.organization_id].trash) {
              hasTrash = KitClient.entityAvailability('service', orgAnswerSet[session.organization_id].trash, {
                datetime: [{ grain: 'day', value: tomorrow }],
                constituentAttributes: session.data_store.attributes,
              }, { toText: false });
            }
            let messageInsert = null;
            if (hasRecycling && !hasTrash) {
              messageInsert = 'recycling';
            } else if (!hasRecycling && hasTrash) {
              messageInsert = 'trash';
            } else if (hasRecycling && hasTrash) {
              messageInsert = 'trash and recycling';
            }
            const client = getPreferredClient(session.constituent);
            if (messageInsert && session.data_store.notifications.sanitation_collection === true && client) {
              const reminderMessage = `Tomorrow is ${messageInsert} collection. Remember to set out after 7pm!`;
              client.send(reminderMessage, [QUICK_REPLIES.sanitationOff]);
            }
          }
        });
      });
    });
  });
}
