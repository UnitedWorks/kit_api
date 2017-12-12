import { bookshelf } from '../orm';
import { Organization, Representative } from '../accounts/models';
import { Media } from '../media/models';
import { Feed } from '../feeds/models';
import { Prompt } from '../prompts/models';
import { Person } from '../persons/models';
import { Phone } from '../phones/models';
import { Place } from '../places/models';
import { Service } from '../services/models';
import { Event } from '../events/models';

// Knowledge Base Entities
export const KnowledgeCategory = bookshelf.Model.extend({
  tableName: 'knowledge_categorys',
  questions() {
    return this.hasMany(KnowledgeQuestion, 'knowledge_category_id');
  },
  persons() {
    return this.belongsToMany(Person, 'knowledge_categorys_persons', 'knowledge_category_id');
  },
  representatives() {
    return this.belongsToMany(Representative, 'knowledge_categorys_representatives', 'knowledge_category_id');
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
  organization() {
    return this.belongsTo(Organization);
  },
  question() {
    return this.belongsTo(KnowledgeQuestion, 'knowledge_question_id');
  },
  events() {
    return this.hasOne(Event, 'id', 'event_id');
  },
  place() {
    return this.hasOne(Place, 'id', 'place_id');
  },
  service() {
    return this.hasOne(Service, 'id', 'service_id');
  },
  media() {
    return this.hasOne(Media, 'id', 'media_id');
  },
  feed() {
    return this.hasOne(Feed, 'id', 'feed_id');
  },
  person() {
    return this.hasOne(Person, 'id', 'person_id');
  },
  phone() {
    return this.hasOne(Phone, 'id', 'phone_id');
  },
  prompt() {
    return this.hasOne(Prompt, 'id', 'prompt_id');
  },
});
