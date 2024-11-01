import geolib from 'geolib';
import moment from 'moment';
import { RRule, RRuleSet } from 'rrule';
import { knex } from '../../orm';
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
      ...answers.organizations.map(o => elementTemplates.genericOrganization(o)),
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

  static sortEntitiesByConstituentDistance(entities, coordinates) {
    if (!coordinates) return [];
    // return entities.filter(e => (e.payload.addresses && e.payload.addresses.length > 0) || e.payload.address || (e.payload.location && e.payload.location.lat)).sort((a, b) => {
    return entities.sort((a, b) => { // Got rid of filter, because even if it doesn't have an address, you should still return it so someone can call/get in touch
      let aCoordinates = null;
      let bCoordinates = null;
      if (a.payload.addresses && a.payload.addresses.length > 0) aCoordinates = a.payload.addresses[0].location.coordinates;
      if (a.payload.location && a.payload.location.lat) aCoordinates = a.payload.location;
      if (b.payload.addresses && b.payload.addresses.length > 0) bCoordinates = b.payload.addresses[0].location.coordinates;
      if (b.payload.location && b.payload.location.lat) aCoordinates = b.payload.location;
      // Evaluate
      if (!aCoordinates && !bCoordinates) return 0;
      if (!aCoordinates) return 1;
      if (!bCoordinates) return -1;
      return geolib.getDistance({ latitude: aCoordinates.lat, longitude: aCoordinates.lon }, { latitude: coordinates[0], longitude: coordinates[1] }) - geolib.getDistance({ latitude: bCoordinates.lat, longitude: bCoordinates.lon }, { latitude: coordinates[0], longitude: coordinates[1] });
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
      finalArray = [];
      entityArray.forEach((e) => {
        if (e.type === 'organization') finalArray.push(elementTemplates.genericOrganization(e.payload));
        if (e.type === 'service') finalArray.push(elementTemplates.genericService(e.payload));
        if (e.type === 'place') finalArray.push(elementTemplates.genericPlace(e.payload));
        if (e.type === 'person') {
          finalArray.push(elementTemplates.genericPerson(e.payload));
          if (e.payload.organizations && e.payload.organizations.length > 0) {
            finalArray.push(elementTemplates.genericOrganization(e.payload.organizations[0]));
          }
        }
        if (e.type === 'phone') finalArray.push(elementTemplates.genericPhone(e.payload));
        if (e.type === 'event') finalArray.push(elementTemplates.genericEvent(e.payload));
        if (e.type === 'resource') finalArray.push(elementTemplates.genericResource(e.payload));
      });
    }
    // If we have coordinates, we want to sort by distance
    return [{
      type: 'template',
      templateType: 'generic',
      image_aspect_ratio: 'horizontal',
      elements: finalArray.filter(d => d),
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
      } else if (lookupType === NLP_TAGS.AVAILABILITY_SCHEDULE) {
        const orgSnip = KitClient.entityAvailability('organization', orgEntity.payload, { constituentAttributes: session.get('attributes'), datetime: session.snapshot.nlp.entities[NLP_TAGS.DATETIME] });
        let placeSnip;
        if (orgEntity.payload.places && orgEntity.payload.places.length > 0) {
          placeSnip = KitClient.entityAvailability('place', orgEntity.payload.places[0], { constituentAttributes: session.get('attributes'), datetime: session.snapshot.nlp.entities[NLP_TAGS.DATETIME] });
        }
        if (orgSnip && !placeSnip) {
          snip = orgSnip;
        } else if (!orgSnip && placeSnip) {
          snip = `${orgEntity.payload.name} is located in ${orgEntity.payload.places[0].name}. ${placeSnip}`;
        } else if (orgSnip && placeSnip) {
          snip = `${orgSnip} ${orgEntity.payload.name} is located in ${orgEntity.payload.places[0].name}. ${placeSnip}`;
        } else if (!orgSnip && !placeSnip) {
          snip = `I don't have hours listed for ${orgEntity.payload.name}.`;
        }
      } else if (lookupType === NLP_TAGS.CONTACT) {
        snip = KitClient.entityContactToText(orgEntity.payload);
      } else if (lookupType === NLP_TAGS.CONTACT_PHONE) {
        snip = KitClient.entityPhonesToText(orgEntity.payload);
      } else if (lookupType === NLP_TAGS.CONTACT_EMAIL) {
        snip = KitClient.entityPhonesToText(orgEntity.payload);
      } else if (lookupType === NLP_TAGS.URL) {
        snip = KitClient.entityURLToText(orgEntity.payload);
      }
      if (snip) concatText = snip;
    } else {
      entityArray.forEach((entity) => {
        let snip = null;
        if (lookupType === NLP_TAGS.AVAILABILITY_SCHEDULE) {
          snip = KitClient.entityAvailability(entity.type, entity.payload, { constituentAttributes: session.get('attributes'), datetime: session.snapshot.nlp.entities[NLP_TAGS.DATETIME] });
        } else if (lookupType === NLP_TAGS.CONTACT || lookupType === NLP_TAGS.CONTACT_PHONE || lookupType === NLP_TAGS.CONTACT_EMAIL) {
          let contactSnip;
          if (lookupType === NLP_TAGS.CONTACT) contactSnip = KitClient.entityContactToText(entity.payload);
          if (lookupType === NLP_TAGS.CONTACT_PHONE) contactSnip = KitClient.entityPhonesToText(entity.payload);
          if (lookupType === NLP_TAGS.CONTACT_EMAIL) contactSnip = KitClient.entityEmailToText(entity.payload);
          if (contactSnip) {
            snip = contactSnip;
          } else if (!contactSnip && entity.payload.organizations && entity.payload.organizations.length > 0) {
            snip = `I don't have that information for ${entity.payload.name}, so I'd try getting in touch with ${entity.payload.organizations[0].name}. ${KitClient.entityContactToText(entity.payload.organizations[0])}`;
          } else {
            snip = `Sorry, I don't have any contact information for ${entity.payload.name}`;
          }
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
      entitySnippet += `${entity.name} can be called at ${entity.number}${entity.extension ? `,${entity.extension}` : ''}`;
    // Otherwise
    } else if (entity.phones && entity.phones.length > 0) {
      entitySnippet += `${entity.name} can be called at ${entity.phones[0].number}${entity.phones[0].extension ? `,${entity.phones[0].extension}` : ''}`;
    }
    if (entity.url) {
      if (entitySnippet.length > 0) {
        entitySnippet += ` and visited online at ${entity.url}`;
      } else {
        entitySnippet += `${entity.name} can be visited online at ${entity.url}`;
      }
    }
    return entitySnippet.length > 0 ? entitySnippet : null;
  }

  static entityPhonesToText(entity) {
    // If entity is a phone
    if (entity.number) {
      return `${entity.name} can be reached at ${entity.number}${entity.extension ? `,${entity.extension}` : ''}`;
    // Otherwise
    } else if (entity.phones && entity.phones.length > 0) {
      return `${entity.name} can be reached at ${entity.phones[0].number}${entity.phones[0].extension ? `,${entity.phones[0].extension}` : ''}`;
    }
    return null;
  }

  static entityEmailToText(entity) {
    if (entity.email) return `${entity.name} can be reached at ${entity.email}`;
    return null;
  }

  static entityLocationToText(type, entity) {
    if (type === 'organization') {
      if (entity.addresses && entity.addresses.length > 0 && entity.addresses[0].address_1) {
        return `${entity.name} is located at ${addressToString(entity.addresses[0])}`;
      } else if (entity.places && entity.places.length > 0 && entity.addresses[0].address_1) {
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

  static entityAvailability(type, entity, { datetime, constituentAttributes = {} } = {}, options = { toText: true }) {
    let availString = '';
    let overrideString = null;
    // Describe General Schedule (even if no datetime, mention schedule)
    if (!datetime && entity.availabilitys) {
      entity.availabilitys.forEach((availability) => {
        // Check if this is an override
        if (availability.over_ride_until || availability.over_ride_reason) {
          if (new Date(availability.over_ride_until) > new Date()) {
            overrideString = `However BE ADVISED, there has been a change: "${availability.over_ride_reason}"`;
          } else {
            knex('availabilitys').where({ id: availability.id }).del().then(d => d);
          }
          return;
        }
        // Geo Check
        if (constituentAttributes.location && availability.geo_rules && availability.geo_rules.coordinates && !geoCheck(availability.geo_rules.coordinates, [constituentAttributes.location.lat, constituentAttributes.location.lon])) return;
        // Analyize RRules/Times
        let rule;
        let timeStart;
        let timeEnd;
        availability.schedule_rules.forEach((schedule) => {
          rule = new RRule(RRule.parseString(schedule.rrule));
          if (schedule.t_start) timeStart = moment(schedule.t_start, 'HH-mm-ss');
          if (schedule.t_end) timeEnd = moment(schedule.t_end, 'HH-mm-ss');
        });
        if (rule) availString = rule.toText();
        if (timeStart && timeEnd) availString = (availString || '').concat(` (${timeStart.format('h:mm A')} - ${timeEnd.format('h:mm A')})`);
        if (availString) availString = availString.trim();
      });
    // Check if a entity's availabilitys use geo and constituent home address is available.
    // If none available, send back message asking for default_address
    } else if (entity.availabilitys && entity.availabilitys.filter(o => o.geo_rules).length > 0 && !constituentAttributes.location) {
      if (!options.toText) return false;
      return i18n('get_home_location', { name: entity.name });
    // Speak to Specific Day Availability
    } else if (datetime && datetime[0] && datetime[0].grain === 'day' && entity.availabilitys && entity.availabilitys.filter(a => a.schedule_rules && a.schedule_rules[0].rrule).length > 0) {
      entity.availabilitys.forEach((availability) => {
        if (availability.over_ride_until || availability.over_ride_reason) {
          if (new Date(availability.over_ride_until) > new Date()) {
            overrideString = `BE ADVISED. A service change is listed: "${availability.over_ride_reason}"`;
          } else {
            knex('availabilitys').where({ id: availability.id }).del().then(d => d);
          }
          return;
        }
        // Geo Check
        if (availability.geo_rules && availability.geo_rules.coordinates && !geoCheck(availability.geo_rules.coordinates, [constituentAttributes.location.lat, constituentAttributes.location.lon])) return;
        // Analyize RRules/Times
        const rruleSet = new RRuleSet();
        let timeStart;
        let timeEnd;
        availability.schedule_rules.forEach((schedule) => {
          rruleSet.rrule(RRule.fromString(schedule.rrule));
          if (schedule.t_start) timeStart = moment(schedule.t_start, 'HH-mm-ss');
          if (schedule.t_end) timeEnd = moment(schedule.t_end, 'HH-mm-ss');
        });
        const floorDate = new Date(datetime[0].value);
        floorDate.setHours(0);
        const dayLaterDate = new Date(datetime[0].value);
        dayLaterDate.setHours(23, 59, 59);
        const betweenSlice = rruleSet.between(floorDate, dayLaterDate);
        if (betweenSlice.length > 0) {
          availString = availString.concat(
            `${moment(betweenSlice[0]).format('dddd, M/DD')}${timeStart && timeEnd ? ` (${timeStart.format('h:mm A')} - ${timeEnd.format('h:mm A')})` : ''}`);
        }
      });
    }
    /* TODO Get Next Availability (how does this trigger? action?) */
    if (availString.length > 0) {
      if (!options.toText) return true;
      if (type === 'service') {
        return `${addressToString(constituentAttributes.address, { slim: true }) ? `I have as your address, ${addressToString(constituentAttributes.address, { slim: true }).trim()}. ` : ''}${entity.name} is available ${availString}.${overrideString ? ` ${overrideString}` : ''}`;
      } else if (type === 'place' || type === 'organization') {
        return `${entity.name} is open ${availString}.${overrideString ? ` ${overrideString}` : ''}`;
      }
    } else if (entity.availabilitys && entity.availabilitys.length > 0 && type === 'place') {
      if (!options.toText) return false;
      // Analyize RRules/Times
      let rule;
      let timeStart;
      let timeEnd;
      entity.availabilitys.forEach(availability => availability.schedule_rules.forEach((schedule) => {
        rule = new RRule(RRule.parseString(schedule.rrule));
        if (schedule.t_start) timeStart = moment(schedule.t_start, 'HH-mm-ss');
        if (schedule.t_end) timeEnd = moment(schedule.t_end, 'HH-mm-ss');
      }));
      return `${entity.name} is unavailable at that time, but is available ${rule.toText()}${timeStart && timeEnd ? ` (${timeStart.format('h:mm A')} - ${timeEnd.format('h:mm A')})` : ''}${overrideString ? ` ${overrideString}` : ''}`;
    }
    // Should do a check for services
    if (!options.toText) return false;
    return null;
  }
}
