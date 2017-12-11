import stringSimilarity from 'string-similarity';
import { searchEntitiesBySimilarity, getEntitiesByFunction } from '../../knowledge-base/helpers';
import KitClient from '../clients/kit-client';
import * as replyTemplates from '../templates/quick-replies';
import * as LOOKUP from '../../constants/nlp-tagging';
import SlackService from '../../utils/slack';
import { Feed } from '../../feeds/models';
import * as FEED_CONSTANTS from '../../constants/feeds';
import { runFeed } from '../../feeds/helpers';

export default {
  async knowledge_entity() {
    const entityStrings = [];
    if (!this.snapshot.nlp) return this.getBaseState();
    if (this.snapshot.nlp.entities.location && this.snapshot.nlp.entities.location.length > 0) {
      entityStrings.push(this.snapshot.nlp.entities.location[0].value);
    }
    if (this.snapshot.nlp.entities.search_query && this.snapshot.nlp.entities.search_query.length > 0) {
      this.snapshot.nlp.entities.search_query.forEach(q => entityStrings.push(q.value));
    }
    if (entityStrings.length === 0) {
      this.messagingClient.send('I didn\'t catch the name of something you\'re looking up. Sorry! Can you say differently for me?');
      return this.getBaseState();
    }

    // Check look up type, and get location if person is looking for closest
    const lookupType = (this.snapshot.nlp.entities && this.snapshot.nlp.entities.entity_property && this.snapshot.nlp.entities.entity_property[0])
      ? this.snapshot.nlp.entities.entity_property[0].value
      : null;
    // Check for user location, and ask for it if we don't have it
    if (lookupType === LOOKUP.LOCATION_CLOSEST && !this.get('last_input')) {
      this.messagingClient.send('Where are you currently located?', [replyTemplates.location, replyTemplates.exit]);
      return this.requestClosestLocation();
    }

    const functionChecks = [];
    if (this.snapshot.nlp.entities.service_function) {
      this.snapshot.nlp.entities.service_function.forEach(f => functionChecks.push(f.value));
    }
    if (this.snapshot.nlp.entities.place_function) {
      this.snapshot.nlp.entities.place_function.forEach(f => functionChecks.push(f.value));
    }
    const similarlyNamedEntities = await searchEntitiesBySimilarity(entityStrings, this.snapshot.organization_id, { limit: 9, confidence: functionChecks.length > 0 ? 0.65 : 0.3 });
    // If no similar enities, but we had place/service functions, get those
    const entitiesByFunction = await getEntitiesByFunction(functionChecks, this.snapshot.organization_id, { sortStrings: entityStrings });
    // Join em
    const joinedEntities = [].concat(similarlyNamedEntities).concat(entitiesByFunction);
    // Abort if we don't have any entities
    if (joinedEntities.length === 0) {
      new SlackService({
        username: 'Entity Search Returned Nothing',
        icon: 'disappointed',
      }).send(`>*Query*: ${this.snapshot.input.payload.text}`);
      this.messagingClient.send('Sorry, I was unable to find a department, place, service, or personnel.');
      return this.getBaseState();
    }

    // Finally Return
    // Produce entities from search
    this.messagingClient.addAll(KitClient.genericTemplateFromEntities(joinedEntities, lookupType, this), replyTemplates.evalHelpfulAnswer);
    // Pick off information based on the request (phone, schedule, etc.)
    if (lookupType) {
      this.messagingClient.addToQuene(KitClient.lookupTextFromEntities(joinedEntities, lookupType, this), replyTemplates.evalHelpfulAnswer);
    }
    return this.messagingClient.runQuene().then(() => this.getBaseState());
  },

  async event() {
    const feeds = await Feed.where({ organization_id: this.snapshot.organization_id, entity: FEED_CONSTANTS.EVENT })
      .fetchAll().then(f => f.toJSON());
    if (feeds.length > 0) {
      this.messagingClient.addToQuene('I think I found what you are looking for:');
    } else {
      this.messagingClient.send('Your local gov hasn\'t recorded any events yet. Sorry!');
      return this.getBaseState();
    }
    const allEvents = await Promise.all(feeds.map(f => runFeed(f).then(found => found.events)))
      .then((feed) => {
        let flattenedArray = [];
        feed.filter(f => f).forEach(f => (flattenedArray = flattenedArray.concat(...f)));
        return flattenedArray;
      });
    // Check for string filters
    const searchStrings = [];
    if (this.snapshot.nlp && this.snapshot.nlp.entities.search_query) {
      this.snapshot.nlp.entities.search_query.forEach((q) => {
        if (!q.value.toLowerCase().includes('event')) searchStrings.push(q.value);
      });
    }
    let finalEventGrouping = [];
    // If strings exist, run filter
    if (allEvents.length > 0 && searchStrings.length > 0) {
      finalEventGrouping = allEvents.filter((event) => {
        let passes = false;
        searchStrings.forEach((string) => {
          passes = passes || stringSimilarity.compareTwoStrings(string, event.name) > 0.32;
        });
        return passes;
      }).sort((a, b) => a.availabilitys[0].t_start - b.availabilitys[0].t_start)
        .slice(0, 10).map(event => ({ type: 'event', payload: event }));
    } else if (allEvents.length > 0) {
      finalEventGrouping = allEvents.sort((a, b) =>
        a.availabilitys[0].t_start - b.availabilitys[0].t_start)
        .slice(0, 10).map(event => ({ type: 'event', payload: event }));
    }
    if (!finalEventGrouping || finalEventGrouping.length === 0) {
      this.messagingClient.addToQuene('Sorry, I was unable to find anything upcoming.');
    } else {
      this.messagingClient.addAll(
        KitClient.genericTemplateFromEntities(finalEventGrouping),
        replyTemplates.evalHelpfulAnswer);
    }
    return this.messagingClient.runQuene().then(() => this.getBaseState());
  },
};
