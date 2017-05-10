import { bookshelf } from '../orm';
import * as AccountModels from '../accounts/models';

export const SurveyQuestion = bookshelf.Model.extend({
  tableName: 'survey_questions',
});

export const SurveyAnswer = bookshelf.Model.extend({
  tableName: 'survey_answers',
  question() {
    return this.hasOne(SurveyQuestion, 'question_id');
  },
  constituent() {
    return this.hasOne(AccountModels.Constituent, 'constituent_id');
  },
});

export const Survey = bookshelf.Model.extend({
  tableName: 'surveys',
  questions() {
    return this.belongsToMany(SurveyQuestion, 'survey_id');
  },
  organization() {
    return this.hasOne(AccountModels.Organization, 'organization_id');
  },
});
