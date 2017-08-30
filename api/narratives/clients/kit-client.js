import { RRule, RRuleSet } from 'rrule';
import moment from 'moment';
import { getAnswers as getAnswersHelper } from '../../knowledge-base/helpers';
import * as elementTemplates from '../templates/elements';

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

  static staticFromAnswers(answers) {
    const answerArray = [{
      type: 'template',
      templateType: 'generic',
      image_aspect_ratio: 'horizontal',
      elements: [
        ...answers.services.map(s => elementTemplates.genericService(s)),
        ...answers.facilities.map(f => elementTemplates.genericFacility(f)),
        ...answers.contacts.map(c => elementTemplates.genericContact(c)),
      ],
    }];
    const textAnswer = KitClient.answerText(answers);
    if (textAnswer) answerArray.unshift(textAnswer);
    return answerArray;
  }

  static entityAvailabilityToText(type, entity, { datetime, constituentAttributes = {} }, options = {}) {
    let entityAvailabilityText = '';
    // Describe General Schedule (even if no datetime, mention schedule)
    if (!datetime) {
      entity.operations.forEach((operation, index, array) => {
        const rule = new RRule(RRule.parseString(operation.rrule));
        const timeStart = moment(operation.t_start, 'HH-mm-ss');
        const timeEnd = moment(operation.t_end, 'HH-mm-ss');
        entityAvailabilityText = entityAvailabilityText.concat(
          `${rule.toText()}${operation.t_start && operation.t_end ? ` (${timeStart.format('h:mm A')} - ${timeEnd.format('h:mm A')})` : ' (No Hours Listed)'}${index !== array.length - 1 ? ' / ' : ''}`);
      });
    // Speak to Specific Day Availability
    } else if (datetime[0].grain === 'day') {
      entity.operations.forEach((operation) => {
        const rruleSet = new RRuleSet();
        rruleSet.rrule(RRule.fromString(operation.rrule));
        const timeStart = moment(operation.t_start, 'HH-mm-ss');
        const timeEnd = moment(operation.t_end, 'HH-mm-ss');
        const floorDate = new Date(datetime[0].value);
        floorDate.setHours(0);
        const dayLaterDate = new Date(datetime[0].value);
        dayLaterDate.setHours(23, 59, 59);
        const betweenSlice = rruleSet.between(floorDate, dayLaterDate);
        if (betweenSlice.length > 0) {
          entityAvailabilityText = entityAvailabilityText.concat(
            `${moment(betweenSlice[0]).format('dddd, M/DD')}${operation.t_start && operation.t_end ? ` (${timeStart.format('h:mm A')} - ${timeEnd.format('h:mm A')})` : ' (No Hours Listed)'}`);
        }
      });
    }
    /* TODO Get Next Availability (how does this trigger? action?) */
    if (entityAvailabilityText.length > 0) {
      if (type === 'service') {
        return `${entity.name} is running in your area ${entityAvailabilityText}`;
      } else if (type === 'facility') {
        return `${entity.name} is open ${entityAvailabilityText}`;
      }
    }
    // Otherwise send back nothing
    return null;
  }

}
