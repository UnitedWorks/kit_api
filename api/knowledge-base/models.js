import { bookshelf } from '../orm';
import * as KnowledgeConstants from '../constants/knowledge-base';

// Information Entries - Referenced in knowledge and non-knowledge base tables
export const Location = bookshelf.Model.extend({
  tableName: 'locations',
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
});

export const KnowledgeFacilityType = bookshelf.Model.extend({
  tableName: 'knowledge_facility_types',
});

export const KnowledgeFacility = bookshelf.Model.extend({
  tableName: 'knowledge_facilitys',
  category: function() {
    return this.belongsTo(KnowledgeCategory, 'category_id');
  },
  events: function() {
    return this.hasMany(KnowledgeEvent, 'facility_id');
  },
  location: function() {
    return this.hasOne(Location, 'id');
  },
  schedule: function() {
    return this.hasOne(Schedule, 'id');
  },
  services: function() {
    return this.hasMany(KnowledgeService, 'facility_id');
  },
  type: function() {
    return this.belongsTo(KnowledgeFacilityType, 'type_id');
  },
});

export const KnowledgeService = bookshelf.Model.extend({
  tableName: 'knowledge_services',
  category: function() {
    return this.belongsTo(KnowledgeCategory, 'category_id');
  },
  events: function() {
    return this.hasMany(KnowledgeEvent, 'service_id');
  },
  facility: function() {
    return this.belongsTo(KnowledgeFacility, 'facility_id');
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
    return this.belongsTo(KnowledgeCategory, 'category_id');
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

const KnowledgeAnswerEvents = bookshelf.Model.extend({
  tabeName: 'knowledge_answers_knowledge_events',
});

const KnowledgeAnswerFacilitys = bookshelf.Model.extend({
  tabeName: 'knowledge_answers_knowledge_facilitys',
});

const KnowledgeAnswerServices = bookshelf.Model.extend({
  tabeName: 'knowledge_answers_knowledge_services',
});

export const KnowledgeAnswer = bookshelf.Model.extend({
  tableName: 'knowledge_answers',
  category: function() {
    return this.belongsTo(KnowledgeCategory, 'category_id');
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
