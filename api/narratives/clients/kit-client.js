import { getAnswers as getAnswersHelper } from '../../knowledge-base/helpers';

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

  static formGenericTemplates(type, objects) {
    const templates = [];
    if (objects.length > 0) {
      if (type === 'facility') {
        objects.forEach((facility) => {
          templates.push({
            type: 'template',
            templateType: 'generic',
            elements: [{
              title: facility.name,
              subtitle: facility.description,
            }],
          });
        });
      } else if (type === 'service') {
        objects.forEach((service) => {
          templates.push({
            type: 'template',
            templateType: 'generic',
            elements: [{
              title: service.name,
              subtitle: service.description,
            }],
          });
        });
      }
      return templates;
    }
    return [];
  }

  static standardAnswerAndProgress(messagingClient, answers, nextState) {
    messagingClient.addAll([
      KitClient.answerText(answers),
      ...KitClient.formGenericTemplates('facility', answers.facilities),
      ...KitClient.formGenericTemplates('service', answers.services),
    ]);
    return messagingClient.runQuene().then(() => nextState);
  }

}
