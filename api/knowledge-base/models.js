import { bookshelf } from '../orm';
import { Organization, Representative } from '../accounts/models';
import { Media } from '../media/models';
import { Prompt } from '../prompts/models';

// Information Entries - Referenced in knowledge and non-knowledge base tables
export const Location = bookshelf.Model.extend({
  tableName: 'locations',
});

export const EventRule = bookshelf.Model.extend({
  tableName: 'event_rules',
});

// Knowledge Base Entities
export const KnowledgeCategory = bookshelf.Model.extend({
  tableName: 'knowledge_categorys',
  questions() {
    return this.hasMany(KnowledgeQuestion, 'knowledge_category_id');
  },
  contacts() {
    return this.belongsToMany(KnowledgeContact, 'knowledge_categorys_knowledge_contacts', 'knowledge_category_id');
  },
  representatives() {
    return this.belongsToMany(Representative, 'knowledge_categorys_representatives', 'knowledge_category_id');
  },
});

export const KnowledgeContact = bookshelf.Model.extend({
  tableName: 'knowledge_contacts',
  hasTimestamps: true,
  hidden: ['_pivot_knowledge_category_id', '_pivot_knowledge_contact_id'],
  photo() {
    return this.hasOne(Media, 'photo_id');
  },
  knowledgeCategories() {
    return this.belongsToMany(KnowledgeCategory, 'knowledge_categorys_knowledge_contacts', 'knowledge_contact_id');
  },
  organization() {
    return this.belongsTo(Organization, 'organization_id');
  },
});

export const KnowledgeFacilityType = bookshelf.Model.extend({
  tableName: 'knowledge_facility_types',
});

export const KnowledgeFacility = bookshelf.Model.extend({
  tableName: 'knowledge_facilitys',
  category() {
    return this.belongsTo(KnowledgeCategory, 'knowledge_category_id');
  },
  type() {
    return this.belongsTo(KnowledgeFacilityType, 'type_id');
  },
  location() {
    return this.belongsTo(Location, 'location_id');
  },
  events() {
    return this.hasMany(KnowledgeEvent, 'knowledge_facility_id');
  },
  eventRules() {
    return this.hasMany(EventRule, 'knowledge_facility_id');
  },
  services() {
    return this.hasMany(KnowledgeService, 'knowledge_facility_id');
  },
});

export const KnowledgeService = bookshelf.Model.extend({
  tableName: 'knowledge_services',
  category() {
    return this.belongsTo(KnowledgeCategory, 'knowledge_category_id');
  },
  events() {
    return this.hasMany(KnowledgeEvent, 'knowledge_service_id');
  },
  facility() {
    return this.belongsTo(KnowledgeFacility, 'knowledge_facility_id');
  },
  location() {
    return this.belongsTo(Location, 'location_id');
  },
  eventRules() {
    return this.hasMany(EventRule, 'knowledge_service_id');
  },
});

export const KnowledgeEvent = bookshelf.Model.extend({
  tableName: 'knowledge_events',
  category() {
    return this.belongsTo(KnowledgeCategory, 'knowledge_category_id');
  },
  facility() {
    return this.hasOne(KnowledgeFacility, 'id');
  },
  location() {
    return this.hasOne(Location, 'id');
  },
  eventRules() {
    return this.hasMany(EventRule, 'knowledge_event_id');
  },
  service() {
    return this.belongsTo(KnowledgeService, 'knowledge_service_id');
  },
});

export const KnowledgeQuestionStats = bookshelf.Model.extend({
  tableName: 'knowledge_question_stats',
  hidden: ['id', 'question_id', 'organization_id'],
});

export const KnowledgeQuestion = bookshelf.Model.extend({
  tableName: 'knowledge_questions',
  hasTimestamps: true,
  answers() {
    return this.hasMany(KnowledgeAnswer, 'question_id');
  },
  answer() {
    return this.hasOne(KnowledgeAnswer, 'question_id');
  },
  category() {
    return this.belongsTo(KnowledgeCategory, 'knowledge_category_id');
  },
  stats() {
    return this.hasOne(KnowledgeQuestionStats, 'question_id');
  },
});

export const KnowledgeAnswer = bookshelf.Model.extend({
  tableName: 'knowledge_answers',
  hasTimestamps: true,
  organization() {
    return this.belongsTo(Organization);
  },
  question() {
    return this.belongsTo(KnowledgeQuestion, 'question_id');
  },
  events() {
    return this.hasOne(KnowledgeEvent, 'id', 'knowledge_event_id');
  },
  facility() {
    return this.hasOne(KnowledgeFacility, 'id', 'knowledge_facility_id');
  },
  service() {
    return this.hasOne(KnowledgeService, 'id', 'knowledge_service_id');
  },
  contact() {
    return this.hasOne(KnowledgeContact, 'id', 'knowledge_contact_id');
  },
  prompt() {
    return this.hasOne(Prompt, 'id', 'prompt_id');
  }
});
