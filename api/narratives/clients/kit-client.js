import geolib from 'geolib';
import { RRule, RRuleSet } from 'rrule';
import moment from 'moment';
import { getAnswers as getAnswersHelper } from '../../knowledge-base/helpers';
import * as elementTemplates from '../templates/elements';
import { i18n } from '../templates/messages';
import { geoCheck } from '../helpers';

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
      ...answers.facilities.map(f => elementTemplates.genericFacility(f)),
      ...answers.contacts.map(c => elementTemplates.genericContact(c)),
      ...answers.events.map(c => elementTemplates.genericEvent(c)),
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

  static genericTemplateFromEntities(entityArray) {
    return [{
      type: 'template',
      templateType: 'generic',
      image_aspect_ratio: 'horizontal',
      elements: entityArray.map((e) => {
        if (e.type === 'service') return elementTemplates.genericService(e.payload);
        if (e.type === 'facility') return elementTemplates.genericFacility(e.payload);
        if (e.type === 'contact') return elementTemplates.genericContact(e.payload);
        if (e.type === 'event') return elementTemplates.genericEvent(e.payload);
        return null;
      }).filter(d => d),
    }];
  }

  static entityContactToText(entity, property) {
    let entityContactText = '';
    // Return specific info
    if (property === 'phone') {
      if (entity.phone_number) return `${entity.name} can be reached at ${entity.phone_number}.`;
      entityContactText = `I can't find a phone number for ${entity.name}.`;
    // Or general contact info
    } else {
      if (entity.phone_number || entity.url) {
        entityContactText = `${entity.name} is available at ${entity.phone_number}${entity.phone_number && entity.url ? ' / ' : ''}${entity.url}.`;
      }
    }
    return entityContactText.length > 0 ? entityContactText : null;
  }

  static entityLocationToText(entity) {
    if (entity.location && entity.location.display_name) {
      return `${entity.name} is located at ${entity.location.display_name}`;
    }
    return null;
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
    } else if (datetime[0].grain === 'day' && entity.availabilitys) {
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
      } else if (type === 'facility') {
        return `${entity.name} is open ${entityAvailabilityText}`;
      }
    }
    // Otherwise send back nothing
    return null;
  }

  static sortEntitiesByDistance(entities, coordinates) {
    return entities.filter(e => e.payload.location && e.payload.location.lat).sort((a, b) => {
      return geolib.getDistance({ latitude: a.payload.lat, longitude: a.payload.lon }, { latitude: coordinates[0], longitude: coordinates[1] }) - geolib.getDistance({ latitude: b.payload.lat, longitude: b.payload.lon }, { latitude: coordinates[0], longitude: coordinates[1] });
    });
  }
}
