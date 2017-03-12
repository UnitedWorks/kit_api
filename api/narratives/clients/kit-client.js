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

  static answerText(answers) {
    const answer = answers.text != null ? answers : answers.filter(a => a.text != null)[0];
    if (answer) {
      return answer.url ? `${answer.text} (${answer.url})` : `${answer.text}`;
    }
    return 'Sorry, I can\'t find an answer for you. :( I\'ll let the city know';
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

}
