import { bookshelf } from '../orm';
import * as AccountModels from '../accounts/models';

export const SurveyQuestion = bookshelf.Model.extend({
  tableName: 'survey_questions',
  hasTimeStamps: true,
});

export const SurveyAnswer = bookshelf.Model.extend({
  tableName: 'survey_answers',
  hasTimeStamps: true,
  question() {
    return this.hasOne(SurveyQuestion, 'question_id');
  },
  constituent() {
    return this.hasOne(AccountModels.Constituent, 'constituent_id');
  },
});

export const Survey = bookshelf.Model.extend({
  tableName: 'surveys',
  hasTimeStamps: true,
  questions() {
    return this.hasMany(SurveyQuestion, 'survey_id');
  },
  organization() {
    return this.hasOne(AccountModels.Organization, 'organization_id');
  },
});
