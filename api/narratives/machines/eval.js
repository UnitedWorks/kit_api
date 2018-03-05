import { KnowledgeQuestion } from '../../knowledge-base/models';
import { getCategoryFallback } from '../../knowledge-base/helpers';
import { EventTracker } from '../../utils/event-tracking';
import SlackService from '../../utils/slack';
import EmailService from '../../utils/email';
import * as env from '../../env';

export default {
  answer_helpful() {
    new SlackService({
      username: 'Helpful',
      icon: 'raised_hands',
    }).send(`>*Con. ${this.snapshot.constituent.id}*`);
    EventTracker('answer_not_helpful', { session: this });
    return 'personality.handle_thank_you';
  },
  answer_not_helpful: {
    async enter() {
      const question = this.get('last_input') && this.get('last_input').nlp ? await KnowledgeQuestion.where({ label: this.get('last_input').nlp.entities.intent[0].value }).fetch({ withRelated: ['category', 'category.fallbacks'] }).then(q => q.toJSON()) : null;
      const slackDebugMessage = question
        ? `>*Constituent ID:* ${this.snapshot.constituent.id}\n>*Asked:* ${this.get('last_input').nlp._text}\n>*Fetched Q. Tag:* ${this.get('last_input').nlp.entities.intent[0].value}\n>*Fetched Q. Example Text:* ${question.question}`
        : `>*Constituent ID:* ${this.snapshot.constituent.id}`;
      new SlackService({
        username: 'Not Helpful',
        icon: 'disappointed',
      }).send(slackDebugMessage);
      EventTracker('answer_helpful', { session: this });
      this.messagingClient.send('Sorry about that. Why wasn\'t this answer helpful?');
    },
    async message() {
      const question = this.get('last_input') && this.get('last_input').nlp ? await KnowledgeQuestion.where({ label: this.get('last_input').nlp.entities.intent[0].value }).fetch({ withRelated: ['category', 'category.fallbacks'] }).then(q => q.toJSON()) : null;
      const fallback = this.get('last_input') && this.get('last_input').nlp ? await getCategoryFallback(this.get('last_input').nlp.entities.intent[0].value, this.snapshot.organization.id).then(f => f) : null;
      if (fallback && fallback.representatives && question) {
        new EmailService().send('🤖 Answer Needs Review (Marked Not Helpful)',
          `A constituent found the bot's response to their question, <b>"${this.get('last_input').nlp._text}"</b> to be unsatisfactory.<br/><br/>Their reason: "<b>${this.snapshot.input.payload.text}</b>"<br/><br/><a href="${env.getDashboardRoot()}/answer?question_id=${question.id}" target="_blank">Please check its answer!</a>`,
          fallback.representatives.map(rep => ({ name: rep.name, email: rep.email })),
          { question_id: question.id });
      }
      new SlackService({
        username: 'Not Helpful',
        icon: 'disappointed',
      }).send(`>*Constituent ID:* ${this.snapshot.constituent.id}\n>*Feedback:* ${this.snapshot.input.payload.text}`);
      return this.messagingClient.send('Thank you for the feedback. I will make a note of this for next time.')
        .then(() => this.getBaseState());
    },
  },
};
