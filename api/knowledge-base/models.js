import { bookshelf } from '../orm';
import { Organization, Representative } from '../accounts/models';
import { Media } from '../media/models';
import { Feed } from '../feeds/models';
import { Prompt } from '../prompts/models';
import { Person } from '../persons/models';
import { Phone } from '../phones/models';
import { Place } from '../places/models';
import { Service } from '../services/models';
import { Resource } from '../resources/models';
import { Event } from '../events/models';

// Knowledge Base Entities
export const KnowledgeEntityFallback = bookshelf.Model.extend({
  tableName: 'knowledge_categorys_fallbacks',
  person() {
    return this.belongsTo(Person, 'person_id');
  },
  phone() {
    return this.belongsTo(Phone, 'phone_id');
  },
  resource() {
    return this.belongsTo(Resource, 'resource_id');
  },
  representative() {
    return this.belongsTo(Representative, 'representative_id');
  },
});

export const KnowledgeCategory = bookshelf.Model.extend({
  tableName: 'knowledge_categorys',
  fallbacks() {
    return this.hasMany(KnowledgeEntityFallback, 'knowledge_category_id');
  },
});

export const KnowledgeQuestionsStats = bookshelf.Model.extend({
  tableName: 'knowledge_questions_stats',
  hidden: ['id', 'knowledge_question_id', 'organization_id'],
});

export const KnowledgeQuestion = bookshelf.Model.extend({
  tableName: 'knowledge_questions',
  hasTimestamps: true,
  answers() {
    return this.hasMany(KnowledgeAnswer, 'knowledge_question_id');
  },
  answer() {
    return this.hasOne(KnowledgeAnswer, 'knowledge_question_id');
  },
  category() {
    return this.belongsTo(KnowledgeCategory, 'knowledge_category_id');
  },
  stats() {
    return this.hasOne(KnowledgeQuestionsStats, 'knowledge_question_id');
  },
});

export const KnowledgeAnswer = bookshelf.Model.extend({
  tableName: 'knowledge_answers',
  hasTimestamps: true,
  owner() {
    return this.belongsTo(Organization, 'owner_organization_id');
  },
  question() {
    return this.belongsTo(KnowledgeQuestion);
  },
  events() {
    return this.belongsTo(Event);
  },
  place() {
    return this.belongsTo(Place);
  },
  service() {
    return this.belongsTo(Service);
  },
  media() {
    return this.belongsTo(Media);
  },
  feed() {
    return this.belongsTo(Feed);
  },
  person() {
    return this.belongsTo(Person);
  },
  phone() {
    return this.belongsTo(Phone);
  },
  resource() {
    return this.belongsTo(Resource);
  },
  prompt() {
    return this.belongsTo(Prompt);
  },
  organization() {
    return this.belongsTo(Organization);
  },
});
