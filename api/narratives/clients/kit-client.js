import { getAnswer as getAnswerHelper } from '../../knowledge-base/helpers';

export default class KitClient {
  constructor(config = {}) {
    this.organization = config.organization;
  }

  getAnswer(label, config = {}) {
    const compiledConfig = Object.assign({
      withRelated: true,
      returnJSON: true,
    }, config);
    return getAnswerHelper({
      label,
      organization_id: this.organization.id,
    }, compiledConfig);
  }

  static answerToString(payload) {
    this.answer = payload.answer;
    let message;
    if (this.answer) {
      message = this.answer.url ? `${this.answer.text} (More info at ${this.answer.url})` : `${this.answer.text}`;
    } else {
      message = 'Sorry, I can\'t find an answer for you. :( I\'ll let the city know';
    }
    return message;
  }

}
