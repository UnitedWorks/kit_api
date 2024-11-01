import stringSimilarity from 'string-similarity';
import { searchEntitiesBySimilarity, getEntitiesByFunction } from '../../knowledge-base/helpers';
import { getIntegrationConfig } from '../../integrations/helpers';
import KitClient from '../clients/kit-client';
import CkanClient from '../clients/ckan-client';
import * as replyTemplates from '../templates/quick-replies';
import * as LOOKUP from '../../constants/nlp-tagging';
import * as INTEGRATION_CONST from '../../constants/integrations';
import SlackService from '../../utils/slack';
import { Feed } from '../../feeds/models';
import * as FEED_CONSTANTS from '../../constants/feeds';
import { runFeed } from '../../feeds/helpers';
import { Boundary } from '../../boundarys/models';
import { geoCheck } from '../helpers';
import * as elementTemplates from '../templates/elements';

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
    if (lookupType === LOOKUP.LOCATION_CLOSEST && (!this.get('attributes') || !this.get('attributes').current_location)) {
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
    const entitiesByFunction = await getEntitiesByFunction(functionChecks, this.snapshot.organization_id, { limit: 9, sortStrings: entityStrings });
    // Join em
    let joinedEntities = [].concat(similarlyNamedEntities).concat(entitiesByFunction);
    if (lookupType === LOOKUP.LOCATION_CLOSEST) {
      joinedEntities = KitClient.sortEntitiesByConstituentDistance(
        [].concat(similarlyNamedEntities).concat(entitiesByFunction),
        [this.get('attributes').current_location.lat, this.get('attributes').current_location.lon]);
    } else if (lookupType === LOOKUP.LOCATION) {
      if (this.get('attributes') && this.get('attributes').location) {
        joinedEntities = KitClient.sortEntitiesByConstituentDistance(
          [].concat(similarlyNamedEntities).concat(entitiesByFunction),
          [this.get('attributes').location.lat, this.get('attributes').location.lon]);
      }
    }
    // Abort if we don't have any entities
    if (joinedEntities.length === 0) {
      new SlackService({
        username: 'Entity Search Returned Nothing',
        icon: 'disappointed',
      }).send(`>*Query*: ${this.snapshot.input.payload.text}`);
      this.messagingClient.send('Sorry, I was unable to find a department, place, service, or personnel.');
      // Clear current location if it was in use
      this.clearCurrentLocation();
      return this.getBaseState();
    }

    // Finally Return
    // Produce entities from search
    this.messagingClient.addAll(KitClient.genericTemplateFromEntities(joinedEntities, lookupType, this), replyTemplates.evalHelpfulAnswer);
    // Pick off information based on the request (phone, schedule, etc.)
    if (lookupType) {
      this.messagingClient.addToQuene(KitClient.lookupTextFromEntities(joinedEntities, lookupType, this), replyTemplates.evalHelpfulAnswer);
    }
    const self = this;
    return this.messagingClient.runQuene().then(() => {
      // Clear current location if it was in use
      self.clearCurrentLocation();
      return self.getBaseState();
    });
  },

  async event() {
    const feeds = await Feed.where({ organization_id: this.snapshot.organization_id, entity: FEED_CONSTANTS.EVENT })
      .fetchAll().then(f => f.toJSON());
    if (feeds.length === 0) {
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
        .slice(0, 5).map(event => ({ type: 'event', payload: event }));
    } else if (allEvents.length > 0) {
      finalEventGrouping = allEvents.sort((a, b) =>
        a.availabilitys[0].t_start - b.availabilitys[0].t_start)
        .slice(0, 5).map(event => ({ type: 'event', payload: event }));
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

  async data() {
    // Grab Seach Strings
    const entityStrings = [];
    if (!this.snapshot.nlp) return this.getBaseState();
    if (this.snapshot.nlp.entities.search_query && this.snapshot.nlp.entities.search_query.length > 0) {
      this.snapshot.nlp.entities.search_query.forEach((q) => {
        // Trimming the 's' off a search query because ckan is picky
        const thisValue = q.value.replace('data', '').trim().toLowerCase();
        if (thisValue.length > 0) entityStrings.push(thisValue.slice(-1) === 's' ? thisValue.slice(0, -1) : thisValue);
      });
    }
    let mayorResources = null;
    if (entityStrings.length > 0) {
      mayorResources = await searchEntitiesBySimilarity(entityStrings, this.snapshot.organization_id, { limit: 5, only: 'resources' });
      if (mayorResources && mayorResources.length > 0) {
        this.messagingClient.addAll(KitClient.genericTemplateFromEntities(mayorResources));
      }
    }
    const ckanConfig = await getIntegrationConfig(
      this.snapshot.organization_id, INTEGRATION_CONST.CKAN).then(c => c);
    const staeConfig = await getIntegrationConfig(
      this.snapshot.organization_id, INTEGRATION_CONST.STAE).then(c => c);

    let ckanResources = null;
    if (!ckanConfig && !staeConfig) {
      this.messagingClient.addToQuene('I didn\'t find any data sets for your local government');
    } else {
      if (entityStrings.length > 0 && ckanConfig) {
        ckanResources = await Promise.all(entityStrings.map(str => new CkanClient(ckanConfig)
          .searchDataResources(str))).then(data => Promise.all([].concat.apply([], data)))
          .then(ar => ar);
      } else if (ckanConfig) {
        ckanResources = new CkanClient(ckanConfig).searchDataResources().then(r => r);
      }
      if (ckanResources && ckanResources.length > 0) {
        this.messagingClient.addAll(KitClient.genericTemplateFromEntities(ckanResources.slice(0, 9)));
      }
    }
    if ((!ckanResources || ckanResources.length === 0) && (!mayorResources || mayorResources.length === 0)) {
      this.messagingClient.addToQuene('Sorry, I wasn\'t able to find any datasets about that.');
    }
    this.messagingClient.addToQuene(`${ckanConfig ? `${this.snapshot.organization.name}'s data portal can be found at ${ckanConfig.portal_url}` : ''} ${staeConfig ? `Realtime data sources are available at https://${staeConfig.municipality_id}.municipal.systems/` : ''}`);
    return this.messagingClient.runQuene().then(() => this.getBaseState());
  },

  political: {
    async enter() {
      // Check for Boundaries
      const boundaries = await Boundary.query(qb => qb.whereRaw("'Political' = ANY(boundarys.functions)")).where('organization_id', '=', this.snapshot.organization.id).fetchAll().then(b => b.length > 0);
      if (!boundaries || boundaries.length === 0) return this.input('message', { boundaries: false });
      // Otherwise Continue
      if (!this.get('attributes').address) return this.requestLocation();
      return this.input('message', { boundaries: true });
    },
    async message(aux = {}) {
      if (aux.boundaries === true) {
        const boundaries = await Boundary.query(qb => qb.whereRaw("'Political' = ANY(boundarys.functions)")).where('organization_id', '=', this.snapshot.organization.id).fetchAll({ withRelated: ['persons', 'organizations'] }).then(b => b.toJSON())
          .filter(b => (geoCheck(b.geo_rules.coordinates, [this.get('attributes').location.lat, this.get('attributes').location.lon])));
        if (boundaries.length > 0) {
          const boundary = boundaries[0];
          const representatives = [
            ...(boundary.persons || []).map(p => ({ type: 'person', payload: p })),
            ...(boundary.organizations || []).map(o => ({ type: 'organization', payload: o })),
          ].filter(e => e);
          this.messagingClient.addAll([{
            type: 'template',
            templateType: 'generic',
            image_aspect_ratio: 'horizontal',
            elements: [elementTemplates.genericBoundary(boundary), ...representatives.map(r => (r.type === 'person' ? elementTemplates.genericPerson(r.payload) : elementTemplates.genericOrganization(r.payload)))],
          }]);
          this.messagingClient.addToQuene(`You are part of ${boundaries[0].name} ${this.get('attributes').address
          ? `(I have your address as ${this.get('attributes').address.address_1})` : ''}${representatives && representatives.length > 0
            ? ` This area is represented by ${representatives.map((r, i) => `${i !== 0 ? ', ' : ''}${r.payload.name}`)}` : ''}.`);
          return this.messagingClient.runQuene().then(() => this.getBaseState());
        }
      }
      return this.messagingClient.send('Unfortunately, I don\'t have political zones saved in my database.').then(() => this.getBaseState());
    },
  },

};
