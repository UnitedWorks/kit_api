import stringSimilarity from 'string-similarity';
import { searchKnowledgeEntities } from '../../knowledge-base/helpers';
import KitClient from '../clients/kit-client';
import * as replyTemplates from '../templates/quick-replies';
import * as LOOKUP from '../../constants/nlp-tagging';
import SlackService from '../../services/slack';
import { logger } from '../../logger';
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
    const knowledgeEntities = await searchKnowledgeEntities(entityStrings, this.snapshot.organization_id, { limit: 9 });
    if (knowledgeEntities.length === 0) {
      try {
        new SlackService({
          username: 'Entity Search Returned Nothing',
          icon: 'disappointed',
        }).send(`>*Query*: ${this.snapshot.input.payload.text}`);
      } catch (e) {
        logger.error(e);
      }
      this.messagingClient.send('I wasn\'t able to find relevant facilities, services, or contacts. Sorry about that.');
      return this.getBaseState();
    }
    // Produce entities from search
    this.messagingClient.addToQuene('Here is what I found for you!');
    this.messagingClient.addAll(KitClient.genericTemplateFromEntities(knowledgeEntities), replyTemplates.evalHelpfulAnswer);
    // Pick off information based on the request (phone, schedule, etc.)
    if (this.snapshot.nlp.entities && this.snapshot.nlp.entities.entity_property && this.snapshot.nlp.entities.entity_property[0]) {
      const lookupType = this.snapshot.nlp.entities.entity_property[0].value;
      this.messagingClient.addAll(knowledgeEntities.map((entity) => {
        if (lookupType === LOOKUP.AVAILABILITY_SCHEDULE) {
          return KitClient.entityAvailabilityToText(entity.type, entity.payload, { constituentAttributes: this.get('attributes') })
        } else if (lookupType === LOOKUP.CONTACT_PHONE) {
          return KitClient.entityContactToText(entity.payload, 'phone');
        } else if (lookupType === LOOKUP.CONTACT) {
          return KitClient.entityContactToText(entity.payload);
        } else if (lookupType === LOOKUP.LOCATION) {
          return KitClient.entityLocationToText(entity.payload);
        }
        return null;
      }).filter(text => text), replyTemplates.evalHelpfulAnswer);
    }
    return this.messagingClient.runQuene().then(() => this.getBaseState());
  },

  async event() {
    const feeds = await Feed.where({ organization_id: this.snapshot.organization_id, entity: FEED_CONSTANTS.EVENT })
      .fetchAll().then(f => f.toJSON());
    if (feeds.length > 0) {
      this.messagingClient.addToQuene('Hmm, let me go see what I can find for you!');
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
