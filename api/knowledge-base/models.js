import lodash from 'lodash';
import { bookshelf } from '../orm';
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

export const KnowledgeQuestion = bookshelf.Model.extend({
  tableName: 'knowledge_questions',
  answers: function() {
    return this.hasMany(KnowledgeAnswer, 'question_id');
  },
  answer: function() {
    return this.hasOne(KnowledgeAnswer, 'question_id');
  },
  category: function() {
    return this.belongsTo(KnowledgeCategory, 'knowledge_category_id');
  },
});

export const KnowledgeAnswer = bookshelf.Model.extend({
  tableName: 'knowledge_answers',
  hasTimestamps: true,
  organization: function() {
    return this.belongsTo(Organization);
  },
  question: function() {
    return this.belongsTo(KnowledgeQuestion, 'question_id');
  },
  events: function() {
    return this.hasOne(KnowledgeEvent, 'id', 'knowledge_event_id');
  },
  facilities: function() {
    return this.hasOne(KnowledgeFacility, 'id', 'knowledge_facility_id');
  },
  services: function() {
    return this.hasOne(KnowledgeService, 'id', 'knowledge_service_id');
  },
});
