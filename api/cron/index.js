import moment from 'moment';
import schedule from 'node-schedule';
import axios from 'axios';
import * as env from '../env';
import * as KNOWLEDGE_CONST from '../constants/knowledge-base';
import * as FEED_CONST from '../constants/feeds';
import { logger } from '../logger';
import { nlp } from '../services/nlp';
import EmailService from '../services/email';
import { Feed } from '../feeds/models';
import { runWatcher, runFeed } from '../feeds/helpers';
import { getCategoryFallback, getAnswers } from '../knowledge-base/helpers';
import { NarrativeSession } from '../narratives/models';
import { messageConstituent, getPreferredClient } from '../conversations/helpers';
import KitClient from '../narratives/clients/kit-client';
import * as QUICK_REPLIES from '../narratives/templates/quick-replies';
import { Organization } from '../accounts/models';

async function twitterWatchers() {
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
  return alertDeck;
}

async function todaysEvents() {
  const feeds = await Feed.where({ watcher: false }).fetchAll().then(f => f);
  const feedEvents = await Promise.all(feeds.toJSON().filter(f => f.entity === 'event').map(feed => runFeed(feed))).then((fResults) => {
    let events = [];
    fResults.forEach(r => (events = events.concat(r.events)));
    return events;
  });
  // Group by organization
  const eventDeck = {};
  feedEvents.filter(e => e.organization_id).forEach((e) => {
    if (!eventDeck[e.organization_id]) eventDeck[e.organization_id] = [];
    // If passes check, push
    const diff = moment().diff(moment(new Date(e.availabilitys[0].t_start)), 'h');
    const passes = diff <= 24 && diff > 0;
    if (passes) eventDeck[e.organization_id].push(e);
  });
  return eventDeck;
}

async function todaysWeather() {
  const organizations = await Organization.fetchAll({ withRelated: ['location'] }).then(o => o.toJSON());
  const weatherDeck = {};
  for (let i = 0; i < organizations.length; i += 1) {
    if (organizations[i].location) {
      const locForecast = await axios.get('http://api.openweathermap.org/data/2.5/weather', { params: {
        APPID: process.env.OPEN_WEATHER_MAP_KEY,
        lat: organizations[i].location.lat,
        lon: organizations[i].location.lon,
        units: 'imperial',
      } }).then(r => r.data);
      weatherDeck[organizations[i].id] = {
        min: locForecast.main.temp_min,
        max: locForecast.main.temp_max,
        weather: locForecast.weather,
      };
    }
  }
  return weatherDeck;
}

export const watchers = () => {
  // Email Representatives of Alerts
  schedule.scheduleJob('0 30 12 * * *', () => {
    const alertDeck = twitterWatchers();
    // Email reps responsbile for the general category + link to FAQ page
    Object.keys(alertDeck).forEach((key) => {
      getCategoryFallback([KNOWLEDGE_CONST.GENERAL_LABEL], key).then((fb) => {
        new EmailService().send('🤖 Service Change Watcher',
          `Some recent public updates mentioned cancellations/rescheduling. Please review <a href="${env.getDashboardRoot()}/faq?organization_id=${key}" target="_blank">common service answers</a> or <a href="${env.getDashboardRoot()}/broadcasting?organization_id=${key}" target="_blank">broadcast a message</a>:<br><br>${alertDeck[key].map(u => `<b>${u.text}</b> (<a href="${u.url}" target="_blank">${u.url})</a><br>`)}`,
          fb.representatives.map(r => ({ email: r.email, name: r.name })),
        );
      }).catch(err => logger.error(err));
    });
  });

  // Constituent Notification: Morning - Weather, Events, Alerts
  schedule.scheduleJob('0 15 13 * * *', () => {
    NarrativeSession.fetchAll({ withRelated: ['constituent', 'constituent.facebookEntry', 'constituent.smsEntry'] }).then((s) => {
      todaysWeather().then((weather) => {
        todaysEvents().then((events) => {
          const quickReplies = [];
          // Run Notifciation on Sessions
          s.toJSON().forEach((session) => {
            const client = getPreferredClient(session.constituent);
            if (!client) return;
            if (!session.data_store.notifications) {
              return client.send(
                'Would you like reminders about trash/recycling collection, big city events, and the weather?',
                [QUICK_REPLIES.allNotificationsOn]);
            }
            // Weather
            if (session.data_store.notifications.weather && weather[session.organization_id]) {
              quickReplies.push(QUICK_REPLIES.weatherOff);
              client.addToQuene(`Today's weather will have a low of ${weather[session.organization_id].max}° and a high of ${weather[session.organization_id].max}°. ${weather[session.organization_id].weather[0] ? `Looks like we're going to have ${weather[session.organization_id].weather[0].description}s.` : ''}`, quickReplies);
            }
            // Events
            if (session.data_store.notifications.events && events[session.organization_id]
              && events[session.organization_id].length > 0) {
              quickReplies.push(QUICK_REPLIES.eventsOff);
              client.addToQuene('Here is whats happening today!');
              client.addAll(KitClient.genericTemplateFromEntities(
                events[session.organization_id].map(event => ({ type: 'event', payload: event }))),
                quickReplies);
            }
            client.runQuene();
          });
        });
      });
    });
  });

  // Constituent Notification: Evening - Services
  schedule.scheduleJob('0 30 20 * * *', () => {
    NarrativeSession.fetchAll().then((s) => {
      // Get sanitation answers for each org
      const sessions = s.toJSON();
      Promise.all([...new Set(sessions.map(session => session.organization_id))].map((orgId) => {
        return getAnswers({ organization_id: orgId, label: 'environment_sanitation.recycling.schedule' }, { answerGrouped: true, returnJSON: true }).then((recyclingCluster) => {
          return getAnswers({ organization_id: orgId, label: 'environment_sanitation.trash.schedule' }, { answerGrouped: true, returnJSON: true }).then((trashCluster) => {
            if (trashCluster.answers.length === 0 &&
              recyclingCluster.answers.length === 0) return null;
            const answerCluster = {};
            if (trashCluster.answers.filter(a => a.service)) {
              if (Object.keys(answerCluster).length === 0) answerCluster[orgId] = {};
              answerCluster[orgId].trash = trashCluster.answers
                .filter(a => a.service).map(a => a.service);
            }
            if (recyclingCluster.answers.filter(a => a.service)) {
              if (Object.keys(answerCluster).length === 0) answerCluster[orgId] = {};
              answerCluster[orgId].recycling = recyclingCluster.answers
                .filter(a => a.serivce).map(a => a.service);
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
            if (orgAnswerSet[session.organization_id].recycling && orgAnswerSet[session.organization_id].recycling[0]) {
              hasRecycling = KitClient.entityAvailabilityToText('service', orgAnswerSet[session.organization_id].recycling[0], {
                datetime: [{ grain: 'day', value: tomorrow }],
                constituentAttributes: session.data_store.attributes
              }) != null;
            }
            if (orgAnswerSet[session.organization_id].trash && orgAnswerSet[session.organization_id].trash[0]) {
              hasTrash = KitClient.entityAvailabilityToText('service', orgAnswerSet[session.organization_id].trash[0], {
                datetime: [{ grain: 'day', value: tomorrow }],
                constituentAttributes: session.data_store.attributes
              }) != null;
            }
            // if (!hasRecycling && !hasTrash) return;
            let messageInsert = null;
            if (hasRecycling && !hasTrash) {
              messageInsert = 'recycling';
            } else if (!hasRecycling && hasTrash) {
              messageInsert = 'trash';
            } else if (hasRecycling && hasTrash) {
              messageInsert = 'trash and recycling';
            }
            // If wants notification, check availability for tomorrow, and send
            if (messageInsert && session.data_store.notifications.sanitation_collection === true) {
              const reminderMessage = `Tomorrow is ${messageInsert} collection. Remember to set out after 4pm!`;
              messageConstituent(session.constituent_id, reminderMessage);
            // If we haven't asked yet, request permission
            }
            // Otherwise the person has said they don't want it
          }
        });
      });
    });
  });
};
