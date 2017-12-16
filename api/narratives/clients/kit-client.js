import geolib from 'geolib';
import { RRule, RRuleSet } from 'rrule';
import moment from 'moment';
import { getAnswers as getAnswersHelper } from '../../knowledge-base/helpers';
import * as elementTemplates from '../templates/elements';
import * as NLP_TAGS from '../../constants/nlp-tagging';
import { i18n } from '../templates/messages';
import { geoCheck } from '../helpers';
import { addressToString } from '../../geo/helpers';

export default class KitClient {
  constructor(config = {}) {
    this.organization = config.organization;
  }

  getAnswer(label, config = {}) {
    const compiledConfig = Object.assign({
      withRelated: true,
      returnJSON: true,
      groupKnowledge: true,
      incrementTimesAsked: true,
    }, config);
    return getAnswersHelper({
      label,
      organization_id: this.organization.id,
    }, compiledConfig);
  }

  static answerText(answerObj) {
    if (Object.hasOwnProperty.call(answerObj, 'text')) {
      return answerObj.text;
    }
    return null;
  }

  static answerMedia(mediaObj) {
    if (mediaObj.type === 'image') {
      return {
        name: mediaObj.name.slice(mediaObj.name.indexOf('_') + 1),
        type: 'image',
        url: mediaObj.url,
      };
    } else if (mediaObj.type === 'file') {
      return {
        name: mediaObj.name.slice(mediaObj.name.indexOf('_') + 1),
        type: 'file',
        url: mediaObj.url,
      };
    }
    return null;
  }

  static genericTemplateFromAnswers(answers) {
    const templateElements = [
      ...answers.services.map(s => elementTemplates.genericService(s)),
      ...answers.places.map(f => elementTemplates.genericPlace(f)),
      ...answers.persons.map(p => elementTemplates.genericPerson(p)),
      ...answers.phones.map(p => elementTemplates.genericPhone(p)),
      ...answers.resources.map(r => elementTemplates.genericResource(r)),
      ...answers.events.map(e => elementTemplates.genericEvent(e)),
    ];
    const answerArray = [];
    const textAnswer = KitClient.answerText(answers);
    if (textAnswer) answerArray.push(textAnswer);
    if (templateElements.length > 0) {
      answerArray.push({
        type: 'template',
        templateType: 'generic',
        image_aspect_ratio: 'horizontal',
        elements: templateElements.slice(0, 10),
      });
    }
    if (answers.media && answers.media.length > 0) {
      answers.media.forEach(media => answerArray.push(KitClient.answerMedia(media)));
    }
    return answerArray;
  }

  static sortEntitiesByDistance(entities, coordinates) {
    return entities.filter(e => e.payload.location && e.payload.location.lat).sort((a, b) => {
      return geolib.getDistance({ latitude: a.payload.lat, longitude: a.payload.lon }, { latitude: coordinates[0], longitude: coordinates[1] }) - geolib.getDistance({ latitude: b.payload.lat, longitude: b.payload.lon }, { latitude: coordinates[0], longitude: coordinates[1] });
    });
  }

  static genericTemplateFromEntities(entityArray, lookupType, session) {
    let finalArray = [];
    // If most similar is organization, return from those assets
    if (entityArray[0] && entityArray[0].type === 'organization') {
      const org = entityArray[0].payload;
      if ([NLP_TAGS.LOCATION, NLP_TAGS.LOCATION_CLOSEST, NLP_TAGS.AVAILABILITY_SCHEDULE].indexOf(lookupType) > -1) {
        // When we handle closest again -> lookupType === [session.get('attributes').current_location.lat, session.get('attributes').current_location.lon]
        if (org.places && org.places.length > 0) {
          org.places.forEach(p => finalArray.push(elementTemplates.genericPlace(p)));
          finalArray.push(elementTemplates.genericOrganization(org));
        } else {
          finalArray.push(elementTemplates.genericOrganization(org));
        }
      } else if (org.phones && (lookupType === NLP_TAGS.URL || lookupType === NLP_TAGS.CONTACT_PHONE)) {
        finalArray.push(elementTemplates.genericOrganization(org));
      } else if (org.persons && lookupType === NLP_TAGS.PERSONNEL) {
        org.persons.forEach(p => finalArray.push(elementTemplates.genericService(p)));
      } else {
        finalArray.push(elementTemplates.genericOrganization(org));
        if (org.places) org.places.forEach(p => finalArray.push(elementTemplates.genericPlace(p)));
        if (org.services) org.services.forEach(s => finalArray.push(elementTemplates.genericService(s)));
      }
    // If closest matching entity wasn't an organization, return normally
    } else {
      finalArray = entityArray.map((e) => {
        if (e.type === 'organization') return elementTemplates.genericOrganization(e.payload);
        if (e.type === 'service') return elementTemplates.genericService(e.payload);
        if (e.type === 'place') return elementTemplates.genericPlace(e.payload);
        if (e.type === 'person') return elementTemplates.genericPerson(e.payload);
        if (e.type === 'phone') return elementTemplates.genericPhone(e.payload);
        if (e.type === 'event') return elementTemplates.genericEvent(e.payload);
        if (e.type === 'resource') return elementTemplates.genericResource(e.payload);
        return null;
      }).filter(d => d);
    }
    // If we have coordinates, we want to sort by distance
    return [{
      type: 'template',
      templateType: 'generic',
      image_aspect_ratio: 'horizontal',
      elements: finalArray,
    }];
  }

  static lookupTextFromEntities(entityArray, lookupType, session) {
    let concatText = '';
    // Pull and concat lookup values
    if (entityArray[0] && entityArray[0].type === 'organization') {
      let snip = null;
      const orgEntity = entityArray[0];
      if ([NLP_TAGS.LOCATION, NLP_TAGS.LOCATION_CLOSEST].indexOf(lookupType) > -1) {
        snip = KitClient.entityLocationToText(orgEntity.type, orgEntity.payload);
      } else if (lookupType === NLP_TAGS.AVAILABILITY_SCHEDULE && orgEntity.payload.places && orgEntity.payload.places.length > 0) {
        snip = KitClient.entityAvailabilityToText('place', orgEntity.payload.places[0], { constituentAttributes: session.get('attributes'), datetime: session.snapshot.nlp.entities[NLP_TAGS.DATETIME] });
        if (snip) snip = `${orgEntity.payload.name}'s hours depend on the location. ${snip}`
      } else if (lookupType === NLP_TAGS.CONTACT) {
        snip = KitClient.entityContactToText(orgEntity.payload);
      } else if (lookupType === NLP_TAGS.CONTACT_PHONE) {
        snip = KitClient.entityPhonesToText(orgEntity.payload);
      } else if (lookupType === NLP_TAGS.URL) {
        snip = KitClient.entityURLToText(orgEntity.payload);
      }
      if (snip) concatText = snip;
    } else {
      entityArray.forEach((entity) => {
        let snip = null;
        if (lookupType === NLP_TAGS.AVAILABILITY_SCHEDULE) {
          snip = KitClient.entityAvailabilityToText(entity.type, entity.payload, { constituentAttributes: session.get('attributes'), datetime: session.snapshot.nlp.entities[NLP_TAGS.DATETIME] });
        } else if (lookupType === NLP_TAGS.CONTACT) {
          snip = KitClient.entityContactToText(entity.payload);
        } else if (lookupType === NLP_TAGS.CONTACT_PHONE) {
          snip = KitClient.entityPhonesToText(entity.payload);
        } else if (lookupType === NLP_TAGS.LOCATION || lookupType === NLP_TAGS.LOCATION_CLOSEST) {
          snip = KitClient.entityLocationToText(entity.type, entity.payload);
        } else if (lookupType === NLP_TAGS.URL) {
          snip = KitClient.entityURLToText(entity.payload);
        }
        if (snip) concatText += ` ${snip}`;
      });
    }
    return concatText.trim();
  }

  static entityContactToText(entity) {
    let entitySnippet = '';
    if (entity.number) {
      entitySnippet += `${entity.name} can be called at ${entity.number}${entity.extension ? ` x ${entity.extension}` : ''}`;
    // Otherwise
    } else if (entity.phones && entity.phones.length > 0) {
      entitySnippet += `${entity.name} can be called at ${entity.phones[0].number}${entity.phones[0].extension ? ` x ${entity.phones[0].extension}` : ''}`;
    }
    if (entity.url) {
      if (entitySnippet.length > 0) {
        entitySnippet += `and visited online at ${entity.url}`;
      } else {
        entitySnippet += `${entity.name} can be visited online at ${entity.url}`;
      }
    }
    return entitySnippet.length > 0 ? entitySnippet : null;
  }

  static entityPhonesToText(entity) {
    // If entity is a phone
    if (entity.number) {
      return `${entity.name} is available at ${entity.number}${entity.extension ? ` x ${entity.extension}` : ''}`;
    // Otherwise
    } else if (entity.phones && entity.phones.length > 0) {
      return `${entity.name} is available at ${entity.phones[0].number}${entity.phones[0].extension ? ` x ${entity.phones[0].extension}` : ''}`;
    }
    return null;
  }

  static entityLocationToText(type, entity) {
    if (type === 'organization') {
      if (entity.addresses && entity.addresses.length > 0) {
        return `${entity.name} is located at ${addressToString(entity.addresses[0])}`;
      } else if (entity.places && entity.places.length > 0) {
        if (entity.places.length === 1) {
          return `${entity.name} is housed at ${entity.places[0].name}${entity.places[0].addresses && entity.places[0].addresses[0] ? `, ${addressToString(entity.places[0].addresses[0])}` : ''}`;
        }
        return `${entity.name} can be found across ${entity.places.map(p => (p.addresses && p.addresses.length > 0 ? `${p.name}, ${addressToString(p.addresses[0])}` : '')).join(', ')}`;
      }
    } else if (type === 'place') {
      if (entity.address && entity.address.address_1 && entity.address.city) {
        return `${entity.name} is located at ${addressToString(entity.address)}`;
      } else if (entity.addresses && entity.addresses.length > 0) {
        return `${entity.name} is located at ${addressToString(entity.addresses[0])}`;
      }
    }
    // Probs should handle service areas
    return null;
  }

  static entityURLToText(entity) {
    return entity.url ? `${entity.name}'s website is ${entity.url}` : null;
  }

  static entityAvailabilityToText(type, entity, { datetime, constituentAttributes = {} } = {}) {
    let entityAvailabilityText = '';
    // Describe General Schedule (even if no datetime, mention schedule)
    if (!datetime && entity.availabilitys) {
      entity.availabilitys.forEach((availability, index, array) => {
        // Geo Check
        if (constituentAttributes.default_location && availability.geo && availability.geo[0] && !geoCheck(availability.geo, [constituentAttributes.default_location.lat, constituentAttributes.default_location.lon])) return;
        // Analyize RRules/Times
        const rule = new RRule(RRule.parseString(availability.rrule));
        const timeStart = moment(availability.t_start, 'HH-mm-ss');
        const timeEnd = moment(availability.t_end, 'HH-mm-ss');
        entityAvailabilityText = entityAvailabilityText.concat(
          `${rule.toText()}${availability.t_start && availability.t_end ? ` (${timeStart.format('h:mm A')} - ${timeEnd.format('h:mm A')})` : ' (No Hours Listed)'}${index !== array.length - 1 ? ' / ' : ''}`);
      });
    // Check if a entity's availabilitys use geo and constituent home address is available.
    // If none available, send back message asking for default_address
    } else if (entity.availabilitys && entity.availabilitys.filter(o => o.geo).length > 0 && !constituentAttributes.default_location) {
      return i18n('get_home_location', { name: entity.name });
    // Speak to Specific Day Availability
    } else if (datetime[0] && datetime[0].grain === 'day' && entity.availabilitys) {
      entity.availabilitys.forEach((availability) => {
        // Geo Check
        if (availability.geo && availability.geo[0] && !geoCheck(availability.geo, [constituentAttributes.default_location.lat, constituentAttributes.default_location.lon])) return;
        // Analyize RRules/Times
        const rruleSet = new RRuleSet();
        rruleSet.rrule(RRule.fromString(availability.rrule));
        const timeStart = moment(availability.t_start, 'HH-mm-ss');
        const timeEnd = moment(availability.t_end, 'HH-mm-ss');
        const floorDate = new Date(datetime[0].value);
        floorDate.setHours(0);
        const dayLaterDate = new Date(datetime[0].value);
        dayLaterDate.setHours(23, 59, 59);
        const betweenSlice = rruleSet.between(floorDate, dayLaterDate);
        if (betweenSlice.length > 0) {
          entityAvailabilityText = entityAvailabilityText.concat(
            `${moment(betweenSlice[0]).format('dddd, M/DD')}${availability.t_start && availability.t_end ? ` (${timeStart.format('h:mm A')} - ${timeEnd.format('h:mm A')})` : ' (No Hours Listed)'}`);
        }
      });
    }
    /* TODO Get Next Availability (how does this trigger? action?) */
    if (entityAvailabilityText.length > 0) {
      if (type === 'service') {
        return `${entity.name} is available ${entityAvailabilityText}`;
      } else if (type === 'place') {
        return `${entity.name} is open ${entityAvailabilityText}`;
      }
    } else if (entity.availabilitys && entity.availabilitys.length > 0 && type === 'place') {
      const quickAvailability = entity.availabilitys[0];
      // Analyize RRules/Times
      const rule = new RRule(RRule.parseString(quickAvailability.rrule));
      const timeStart = moment(quickAvailability.t_start, 'HH-mm-ss');
      const timeEnd = moment(quickAvailability.t_end, 'HH-mm-ss');
      return `${entity.name} is unavailable at that time, but is available ${rule.toText()}${quickAvailability.t_start && quickAvailability.t_end ? ` (${timeStart.format('h:mm A')} - ${timeEnd.format('h:mm A')})` : ' (No Hours Listed)'}`;
    }
    // Should do a check for services
    return null;
  }
}
