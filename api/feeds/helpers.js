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
  return axios.get('http://www.cityofjerseycity.com/meetings-calendar.aspx').then(r => {
    // Capture Events on Page
    const events = [];
    const $ = cheerio.load(r.data);
    // Construct Event Info
    $('.mv_dayBorder').filter((i, elem) => {
      return $(elem).text().trim().length > 5;
    }).each((i, elem) => {
      let date = null;
      const event = {
        url: 'http://www.cityofjerseycity.com/meetings-calendar.aspx',
        availabilitys: [{}],
      };
      $(elem).find('tbody').children().each((i, tr) => {
        if (i === 0) {
          // If first TR, we're looking at date
          const searchResults = /,'(.*)'.*$/.exec($(tr).find('a').attr('onclick'));
          if (searchResults.length > 1) date = searchResults[1];
          delete event.name;
          delete event.location;
          event.availabilitys = [{}];
        } else {
          // Otherwise we're grabbing an event
          $(tr).find('.mv_TodayCell').find('tr').each((dataIndex, data) => {
            if (dataIndex === 0) {
              // Name
              event.name = $(data).text();
            } else if (dataIndex === 1) {
              // Location
              const locRegex = /Location:(.*)/.exec($(data).text())[1];
              if (locRegex) event.location = { display_name: locRegex };
            } else if (dataIndex === 2) {
              // Start Date/Time
              event.availabilitys[0].t_start = new Date(`${/Start:(.*)/.exec($(data).text())[1]}${date}`);
            } else if (dataIndex === 3) {
              // End Date/Time
              event.availabilitys[0].t_end = new Date(`${/End:(.*)/.exec($(data).text())[1]}${date}`);
            }
          });
          // Only push if we got at least a title
        }
      });
      if (event.name && event.availabilitys[0].t_start > Date.now()) events.push(event);
    });
    return events;
  });
})
*/

export function veventToKnowledgeEvent(vevent) {
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
      .filter(v => (options.filterPast && v.end ?
        new Date(v.end) > Date.now() : options.filterPast && true))
      // Refromat to our standard
      .map(event => veventToKnowledgeEvent({ ...event, organization_id: feed.organization_id }));
    return { events };
  } else if (feed.format === FEED_CONSTANTS.SCRAPED) {
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
