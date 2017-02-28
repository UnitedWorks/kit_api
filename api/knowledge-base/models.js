import lodash from 'lodash';
import { bookshelf, knex } from '../orm';
import { Organization } from '../accounts/models';

// Information Entries - Referenced in knowledge and non-knowledge base tables
export const Location = bookshelf.Model.extend({
  tableName: 'locations',
  parse: (attr) => {
    return lodash.reduce(attr, (record, val, key) => {
      record[lodash.camelCase(key)] = val;
      return record;
    }, {});
  },
  format: (attr) => {
    return lodash.reduce(attr, (record, val, key) => {
      record[lodash.snakeCase(key)] = val;
      return record;
    }, {});
  },
});

export const Schedule = bookshelf.Model.extend({
  tableName: 'schedules',
});

export const Media = bookshelf.Model.extend({
  tableName: 'medias',
});

// Knowledge Base Entries - Think of as complex objects
export const KnowledgeCategory = bookshelf.Model.extend({
  tableName: 'knowledge_categorys',
  questions: function() {
    return this.hasMany(KnowledgeQuestion, 'knowledge_category_id');
  },
});

export const KnowledgeFacilityType = bookshelf.Model.extend({
  tableName: 'knowledge_facility_types',
});

export const KnowledgeFacility = bookshelf.Model.extend({
  tableName: 'knowledge_facilitys',
  category: function() {
    return this.belongsTo(KnowledgeCategory, 'knowledge_category_id');
  },
  events: function() {
    return this.hasMany(KnowledgeEvent, 'knowledge_facility_id');
  },
  location: function() {
    return this.hasOne(Location, 'id');
  },
  schedule: function() {
    return this.hasOne(Schedule, 'id');
  },
  services: function() {
    return this.hasMany(KnowledgeService, 'knowledge_facility_id');
  },
  type: function() {
    return this.belongsTo(KnowledgeFacilityType, 'type_id');
  },
});

export const KnowledgeService = bookshelf.Model.extend({
  tableName: 'knowledge_services',
  category: function() {
    return this.belongsTo(KnowledgeCategory, 'knowledge_category_id');
  },
  events: function() {
    return this.hasMany(KnowledgeEvent, 'service_id');
  },
  facility: function() {
    return this.belongsTo(KnowledgeFacility, 'knowledge_facility_id');
  },
  location: function() {
    return this.hasOne(Location, 'id');
  },
  schedule: function() {
    return this.hasOne(Schedule, 'id');
  },
});

export const KnowledgeEvent = bookshelf.Model.extend({
  tableName: 'knowledge_events',
  category: function() {
    return this.belongsTo(KnowledgeCategory, 'knowledge_category_id');
  },
  facility: function() {
    return this.hasOne(KnowledgeFacility, 'id');
  },
  location: function() {
    return this.hasOne(Location, 'id');
  },
  schedule: function() {
    return this.hasOne(Schedule, 'id');
  },
  service: function() {
    return this.belongsTo(KnowledgeService, 'service_id');
  },
});

export const KnowledgeAnswerEvents = bookshelf.Model.extend({
  tableName: 'knowledge_answers_knowledge_events',
});

export const KnowledgeAnswerFacilitys = bookshelf.Model.extend({
  tableName: 'knowledge_answers_knowledge_facilitys',
});

export const KnowledgeAnswerServices = bookshelf.Model.extend({
  tableName: 'knowledge_answers_knowledge_services',
});

export const KnowledgeQuestion = bookshelf.Model.extend({
  tableName: 'knowledge_questions',
  answer: function() {
    return this.belongsTo(KnowledgeAnswer, 'knowledge_answer_id');
  },
  category: function() {
    return this.belongsTo(KnowledgeCategory, 'knowledge_category_id');
  },
});

export const KnowledgeAnswer = bookshelf.Model.extend({
  tableName: 'knowledge_answers',
  hasTimestamps: true,
  question: function() {
    return this.belongsTo(KnowledgeQuestion, 'knowledge_questions_organizations_knowledge_answers');
  },
  organization: function() {
    return this.belongsTo(Organization, 'knowledge_questions_organizations_knowledge_answers')
  },
  events: function() {
    return this.belongsToMany(KnowledgeEvent, 'knowledge_answers_knowledge_events');
  },
  facilities: function() {
    return this.belongsToMany(KnowledgeFacility, 'knowledge_answers_knowledge_facilitys');
  },
  services: function() {
    return this.belongsToMany(KnowledgeService, 'knowledge_answers_knowledge_services');
  },
});

export const OrganizationQuestionAnswers = bookshelf.Model.extend({
  tableName: 'knowledge_questions_organizations_knowledge_answers',
  answer: function() {
    return this.belongsTo(KnowledgeAnswer, 'knowledge_answer_id');
  },
  organization: function() {
    return this.belongsTo(Organization, 'organization_id');
  },
  question: function() {
    return this.belongsTo(KnowledgeQuestion, 'knowledge_question_id');
  },
});
