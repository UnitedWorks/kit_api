import axios from 'axios';
import cheerio from 'cheerio';
import ical from 'ical';
import moment from 'moment';
import Twitter from 'twitter';
import { Feed } from './models';
import * as FEED_CONSTANTS from '../constants/feeds';

async function scrapeEvents(script) {
  // This is a mess. Evaluating code stored in feed columns. Example below
  return await eval(script)(axios, cheerio).then(r => r);
}

/* TODO: Make this process a little less nuts.
Nightmare is funky to use with Docker because missing binaries for Electron
Cheerio is probably the better route though
Example Feed script code:
(function(axios, cheerio) {
  return axios('http://www.jerseycitynj.gov/common/controls/WorkspaceCalendar/ws/WorkspaceCalendarWS.asmx/GetEventList', {
    method: 'post',
    headers: {
      "content-type": "application/json",
      "cache-control": "no-cache",
    },
    data: `{\n\t\"calendarIds\": [6210138],\n\t\"endDate\": \"\\/Date(${Date.now() + 2601000000})\\/\",\n\t\"enumFilter\": [],\n\t\"startDate\": \"\\/Date(${Date.now()})\\/\",\n\t\"stringFieldSet\": [],\n\t\"stringSearchValue\": \"\",\n\t\"stringSelectedField\": null\n}`
  }).then(({ data }) => {
    return (data.d.Result || []).map((e) => {
      return {
        url: 'http://www.jerseycitynj.gov/calendar',
        name: e.Title,
        location: {
          display_name: e.Location,
        },
        availabilitys: [{
          t_start: new Date(`${e.StartHour}:${e.StartMinute} ${e.StartMonth}/${e.StartDayOfMonth}/${e.StartYear}`),
          t_end: new Date(`${e.EndHour}:${e.EndMinute} ${e.EndMonth}/${e.EndDayOfMonth}/${e.EndYear}`)
        }]
      }
    });
  }).catch(() => []);
})
*/

export function veventToEvent(vevent) {
  return {
    name: vevent.summary,
    description: vevent.description,
    organization_id: vevent.organization_id,
    url: vevent.url,
    location: {
      display_name: vevent.location,
    },
    availabilitys: [{
      t_start: vevent.start,
      t_end: vevent.end,
    }],
  };
}

export async function runFeed(feedObj, options = { filterPast: true }) {
  let feed = feedObj;
  if (!feed.id) throw new Error('No feed.id provided');
  if (!feed.format) {
    feed = await Feed.where({ id: feed.id }).fetch().then(f => (f ? f.toJSON() : null));
  }
  // iCal
  if (feed.format === FEED_CONSTANTS.ICS) {
    const ics = await axios.get(feed.config.url).then(c => ical.parseICS(c.data));
    const events = Object.keys(ics)
      // Obj to array
      .map(v => ics[v])
      // Filter out events that have passed unless default is overriden
      .filter((v) => {
        if (!options.filterPast) return false;
        const diff = moment(new Date(v.start)).diff(moment(), 'h');
        return diff > -3;
      })
      // Refromat to our standard
      .map(event => veventToEvent({ ...event, organization_id: feed.organization_id }));
    return { events };
  } else if (feed.format === FEED_CONSTANTS.SCRIPT) {
    const results = await scrapeEvents(feed.script).then(r => r);
    return {
      events: results.map(e => ({ ...e, organization_id: feed.organization_id })),
    };
  }
  return {};
}

export async function runWatcher(feedObj, options = { hours: 24 }) {
  let feed = feedObj;
  if (!feed.id) throw new Error('No feed.id provided');
  if (!feed.format) {
    feed = await Feed.where({ id: feed.id }).fetch().then(f => (f ? f.toJSON() : null));
  }
  if (feed.format === FEED_CONSTANTS.TWITTER && feed.topic === FEED_CONSTANTS.ALERTS_SCHEDULE_CHANGE) {
    const twitterClient = new Twitter({
      consumer_key: process.env.TWITTER_CONSUMER_KEY,
      consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
      bearer_token: process.env.TWITTER_BEARER,
    });
    const filteredTweets = await new Promise((resolve, reject) => {
      twitterClient.get('/statuses/user_timeline.json', {
        screen_name: feed.config.twitter_handle,
      }, (error, tweets) => {
        if (error) reject(error);
        const mappedTweets = tweets.map(t => ({
          text: t.text,
          created_at: t.created_at,
          organization_id: feed.organization_id,
          url: `https://twitter.com/${feed.config.twitter_handle}/status/${t.id_str}`,
        }));
        resolve(mappedTweets.filter(t => (moment().diff(moment(new Date(t.created_at)), 'h') <= options.hours)));
      });
    }).then(t => t);
    return filteredTweets;
  }
  return [];
}
