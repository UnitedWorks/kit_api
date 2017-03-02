import { getAnswers as getAnswersHelper } from '../../knowledge-base/helpers';

export default class KitClient {
  constructor(config = {}) {
    this.organization = config.organization;
  }

  getAnswer(label, config = {}) {
    const compiledConfig = Object.assign({
      withRelated: true,
      returnJSON: true,
    }, config);
    return getAnswersHelper({
      label,
      organization_id: this.organization.id,
    }, compiledConfig);
  }

  static answersToString(answers) {
    const answer = answers[0];
    if (answer) {
      return answer.url ? `${answer.text} (More info at ${answer.url})` : `${answer.text}`;
    }
    return 'Sorry, I can\'t find an answer for you. :( I\'ll let the city know';
  }

}
