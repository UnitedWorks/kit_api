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
    let entityString = null;
    if (this.snapshot.nlp.entities.search_query && this.snapshot.nlp.entities.search_query[0]) {
      entityString = this.snapshot.nlp.entities.search_query[0].value;
    } else if (this.snapshot.nlp.entities.location && this.snapshot.nlp.entities.location[0]) {
      entityString = this.snapshot.nlp.entities.location[0].value;
    }
    if (!entityString) {
      this.messagingClient.send('I didn\'t catch the name of something you\'re looking up. Sorry! Can you try again for me?');
      return this.getBaseState();
    }
    const knowledgeEntities = await searchKnowledgeEntities({
      text: entityString,
      organization_id: this.snapshot.organization_id,
    }, { limit: 3 });
    if (knowledgeEntities.length === 0) {
      try {
        new SlackService({
          username: 'Entity Search Returned Nothing',
          icon: 'disappointed',
        }).send(`>*Query*: ${this.snapshot.input.payload.text}`);
      } catch (e) {
        logger.error(e);
      }
      this.messagingClient.send('Hmm, I wasn\'t able to find any relevant facilities, services, or contacts. Sorry about that.');
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
          // return KitClient.entityLocationToText(entity.payload, 'location');
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
        feed.forEach(f => (flattenedArray = flattenedArray.concat(...f)));
        return flattenedArray;
      });
    const filteredEvents = allEvents.filter(event => stringSimilarity.compareTwoStrings(this.snapshot.input.payload.text, event.name) > 0.32)
      .slice(0, 9).map(event => ({ type: 'event', payload: event }));
    if (filteredEvents.length > 0) {
      this.messagingClient.addAll(KitClient.genericTemplateFromEntities(filteredEvents), replyTemplates.evalHelpfulAnswer);
    } else {
      this.messagingClient.addToQuene('Sorry, I was unable to find upcoming events for you.');
    }
    return this.messagingClient.runQuene().then(() => this.getBaseState());
  },
};
