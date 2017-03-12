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

  static formGenericTemplate(type, objects) {
    const template = {
      type: 'template',
      templateType: 'generic',
      image_aspect_ratio: 'horizontal',
      elements: [],
    };
    if (objects.length > 0) {
      objects.forEach((object) => {
        const elementButtons = [];
        if (object.hasOwnProperty('location')) {
          elementButtons.push({
            type: 'web_url',
            title: object.location.formattedAddress,
            url: getPlacesUrl(object.location.formattedAddress),
          });
        }
        if (object.hasOwnProperty('phone_number')) {
          elementButtons.push({
            type: 'phone_number',
            title: object.phone_number,
            payload: object.phone_number,
          });
        }
        if (object.hasOwnProperty('url')) {
          elementButtons.push({
            type: 'web_url',
            title: object.url,
            url: object.url,
            webview_height_ratio: 'tall',
          });
        }
        template.elements.push({
          title: object.name,
          subtitle: object.brief_description,
          buttons: elementButtons,
        });
      });
      return [template];
    }
    return [];
  }

  static compileAnswers(answers) {
    return [
      KitClient.answerText(answers),
      ...KitClient.formGenericTemplate('facility', answers.facilities),
      ...KitClient.formGenericTemplate('service', answers.services),
    ];
  }

}
