import { RRule, RRuleSet } from 'rrule';
import moment from 'moment';
import { getAnswers as getAnswersHelper } from '../../knowledge-base/helpers';
import { getPlacesUrl } from '../../utils';

export default class KitClient {
  constructor(config = {}) {
    this.organization = config.organization;
  }

  getAnswer(label, config = {}) {
    const compiledConfig = Object.assign({
      withRelated: true,
      returnJSON: true,
      groupKnowledge: true,
    }, config);
    return getAnswersHelper({
      label,
      organization_id: this.organization.id,
    }, compiledConfig);
  }

  static answerText(answerObj) {
    if (Object.hasOwnProperty.call(answerObj, 'text')) {
      return answerObj.url ? `${answerObj.text} (${answerObj.url})` : `${answerObj.text}`;
    }
    return 'Sorry, I can\'t find an answer for you. :( I\'ll try to get one for you soon';
  }

  static knowledgeEntityToTemplate(type, objects) {
    const template = {
      type: 'template',
      templateType: 'generic',
      image_aspect_ratio: 'horizontal',
      elements: [],
    };
    if (objects.length > 0) {
      objects.forEach((object) => {
        const elementButtons = [];
        if (object.hasOwnProperty('location') && object.location.formattedAddress != null) {
          elementButtons.push({
            type: 'web_url',
            title: object.location.formattedAddress,
            url: getPlacesUrl(object.location.formattedAddress),
          });
        }
        if (object.hasOwnProperty('phone_number') && object.phone_number != null) {
          elementButtons.push({
            type: 'phone_number',
            title: object.phone_number,
            payload: object.phone_number,
          });
        }
        if (object.hasOwnProperty('url') && object.url != null) {
          elementButtons.push({
            type: 'web_url',
            title: object.url,
            url: object.url,
            webview_height_ratio: 'tall',
          });
        }
        let scheduleString;
        if (object.eventRules[0].rrule) {
          scheduleString = '';
          if (object.eventRules[0].t_start) {
            const timeStart = moment(object.eventRules[0].t_start, 'HH-mm-ss');
            scheduleString = scheduleString.concat(`From ${timeStart.format('h:mm A')}`);
          }
          if (object.eventRules[0].t_start && object.eventRules[0].t_end) {
            const timeEnd = moment(object.eventRules[0].t_end, 'HH-mm-ss');
            scheduleString = scheduleString.concat(` to ${timeEnd.format('h:mm A')} `);
          }
          scheduleString = scheduleString.concat(`${RRule.fromString(object.eventRules[0].rrule).toText()}`);
        }
        template.elements.push({
          title: object.name,
          subtitle: scheduleString || object.brief_description || object.description,
          buttons: elementButtons,
        });
      });
      return [template];
    }
    return [];
  }

  static staticAnswer(answers) {
    return [
      KitClient.answerText(answers),
      ...KitClient.knowledgeEntityToTemplate('facility', answers.facilities),
      ...KitClient.knowledgeEntityToTemplate('service', answers.services),
    ];
  }

  static dynamicAnswer(answer, datetimeEntity) {
    const responses = [];
    const simpleScheduleDescriber = object => {
      const timeStart = moment(object.eventRules[0].t_start, 'HH-mm-ss');
      const timeEnd = moment(object.eventRules[0].t_end, 'HH-mm-ss');
      let objectResponse = `Facility: ${object.name}`
        .concat(`Schedule: ${RRule.fromString(object.eventRules[0].rrule).toText()}`);
      if (object.eventRules[0].t_start && object.eventRules[0].t_end) {
        objectResponse = objectResponse.concat(`\nHours: ${timeStart.format('h:mm A')} - ${timeEnd.format('h:mm A')}`);
      } else if (object.eventRules[0].t_start) {
        objectResponse = objectResponse.concat(`\nHours: ${timeStart.format('h:mm A')}`);
      }
      return objectResponse;
    }
    const complexScheduleDescriber = (entity) => {
      const rruleSet = new RRuleSet();
      const entityResponses = [];
      rruleSet.rrule(RRule.fromString(entity.eventRules[0].rrule));
      const timeStart = moment(entity.eventRules[0].t_start, 'HH-mm-ss');
      const timeEnd = moment(entity.eventRules[0].t_end, 'HH-mm-ss');
      if ((datetimeEntity[0].from && datetimeEntity[0].to) || datetimeEntity[0].grain === 'week') {
        // Times in a period from - to
        let betweenSlice;
        if (datetimeEntity[0].from != null && datetimeEntity[0].to != null) {
          betweenSlice = rruleSet.between(new Date(datetimeEntity[0].from.value),
            new Date(datetimeEntity[0].to.value));
        } else {
          const weekLaterDate = new Date(datetimeEntity[0].value);
          weekLaterDate.setDate(weekLaterDate.getDate() + 7);
          betweenSlice = rruleSet.between(new Date(datetimeEntity[0].value), weekLaterDate);
        }
        let thisServiceResponse = `${entity.name} Schedule: `;
        if (betweenSlice.length > 0) {
          betweenSlice.forEach((slice) => {
            thisServiceResponse = thisServiceResponse.concat(`${moment(slice).format('ddd, M/DD')} (${timeStart.format('h:mm A')} - ${timeEnd.format('h:mm A')}) `);
          });
          entityResponses.push(thisServiceResponse);
        }
      } else if (datetimeEntity[0].value) {
        // Specific Day = Yes/NO
        // If grain is 'day', then '"Yes, there is ... (with requested hours if available)"
        // If grain is 'week', then '"Yes, there is trash pickup (schedule w/ hours)"
        if (datetimeEntity[0].grain === 'day') {
          const floorDate = new Date(datetimeEntity[0].value);
          floorDate.setHours(0);
          const dayLaterDate = new Date(datetimeEntity[0].value);
          dayLaterDate.setHours(23, 59, 59);
          const betweenSlice = rruleSet.between(floorDate, dayLaterDate);
          let thisServiceResponse = `${entity.name} Schedule: `;
          if (betweenSlice.length === 1) {
            thisServiceResponse = thisServiceResponse.concat(`${moment(betweenSlice[0]).format('ddd, M/DD')} (${timeStart.format('h:mm A')} - ${timeEnd.format('h:mm A')}) `);
            entityResponses.push(thisServiceResponse);
          }
        } else if (datetimeEntity[0].grain === 'week') {
          const weekLaterDate = new Date(datetimeEntity[0].value);
          weekLaterDate.setDate(weekLaterDate.getDate() + 7);
          const betweenSlice = rruleSet.between(new Date(datetimeEntity[0].value), weekLaterDate);
          let thisServiceResponse = `${entity.name} Schedule: `;
          if (betweenSlice.length > 0) {
            betweenSlice.forEach((slice) => {
              thisServiceResponse = thisServiceResponse.concat(`${moment(slice).format('ddd, M/DD')} (${timeStart.format('h:mm A')} - ${timeEnd.format('h:mm A')}) `);
            });
            entityResponses.push(thisServiceResponse);
          }
        }
      }
      return entityResponses;
    };

    // If we're not provided datetime specifics, list generic schedule
    if (!datetimeEntity) {
      responses.push(KitClient.answerText(answer));
      answer.facilities.forEach((facility) => {
        responses.push(simpleScheduleDescriber(facility));
      });
      answer.services.forEach((service) => {
        responses.push(simpleScheduleDescriber(service));
      });
    } else {
      answer.facilities.forEach((facility) => {
        responses.push(...complexScheduleDescriber(facility));
      });
      answer.services.forEach((service) => {
        responses.push(...complexScheduleDescriber(service));
      });
    }

    if (responses.length === 0) {
      if (datetimeEntity[0].from && datetimeEntity[0].to) {
        return [`I wasn't able to find anything from ${moment(datetimeEntity[0].from.value).format('ddd, M/DD')} to ${moment(datetimeEntity[0].to.value).format('ddd, M/DD')}.`];
      }
      return [`I wasn't able to find anything available for ${moment(datetimeEntity[0].value).format('ddd, M/DD')}.`];
    }
    return responses;
  }

}
