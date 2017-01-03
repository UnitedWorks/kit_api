import Joi from 'joi';
import { bookshelf } from '../orm';
import * as KnowledgeConstants from '../constants/knowledge-base';

// Information Entries - Referenced in knowledge and non-knowledge base tables
export const Location = bookshelf.Model.extend({
  tableName: 'locations',
});

export const LocationSchema = Joi.object({
  id: Joi.string(),
  address: Joi.string(),
  neighborhood: Joi.string(),
  borough: Joi.string(),
  city: Joi.string(),
  state: Joi.string(),
  zipcode: Joi.string(),
  lat: Joi.string(),
  long: Joi.string(),
  additionalAddressInfomration: Joi.string(),
});

export const Schedule = bookshelf.Model.extend({
  tableName: 'schedules',
});

export const ScheduleSchema = Joi.object({
  id: Joi.string(),
  // ?
});

export const Media = bookshelf.Model.extend({
  tableName: 'medias',
});

export const MediaSchema = Joi.object({
  id: Joi.string(),
  name: Joi.string(),
  type: Joi.string().valid(KnowledgeConstants.MEDIA_TYPES),
  url: Joi.string(),
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
    return this.belongsTo(KnowledgeCategory, 'id');
  },
  type: function() {
    return this.belongsTo(KnowledgeFacilityType, 'id');
  },
  schedule: function() {
    return this.hasOne(Schedule, 'id');
  },
  location: function() {
    return this.hasOne(Location, 'id');
  },
  services: function() {
    return this.hasMany(KnowledgeService, 'facility_id');
  },
});

export const KnowledgeFacilitySchema = Joi.object({
  id: Joi.string(),
  name: Joi.string(),
  category: Joi.string().valid(KnowledgeConstants.CATEGORIES),
  description: Joi.string(),
});

export const KnowledgeService = bookshelf.Model.extend({
  tableName: 'knowledge_services',
  category: function() {
    return this.belongsTo(KnowledgeCategory, 'id');
  },
  schedule: function() {
    return this.hasOne(Schedule, 'id');
  },
  location: function() {
    return this.hasOne(Location, 'id');
  },
  facility: function() {
    return this.hasOne(KnowledgeFacility, 'id');
  },
});

export const KnowledgeServiceSchema = Joi.object({
  id: Joi.string(),
  name: Joi.string(),
  categories: Joi.array().items(Joi.string()),
  description: Joi.string(),
});

export const KnowledgeEvent = bookshelf.Model.extend({
  tableName: 'knowledge_events',
  category: function() {
    return this.belongsTo(KnowledgeCategory, 'id');
  },
  schedule: function() {
    return this.hasOne(Schedule, 'id');
  },
  location: function() {
    return this.hasOne(Location, 'id');
  },
  facility: function() {
    return this.hasOne(KnowledgeFacility, 'id');
  },
  service: function() {
    return this.belongsTo(KnowledgeService, 'id');
  },
});

export const KnowledgeEventSchema = Joi.object({
  id: Joi.string(),
  name: Joi.string(),
  description: Joi.string(),
});

export const KnowledgeAnswer = bookshelf.Model.extend({
  tableName: 'knowledge_answers',
  category: function() {
    return this.belongsTo(KnowledgeCategory, 'id');
  },
  events: function() {
    return this.belongsToMany(KnowledgeEvent);
  },
  services: function() {
    return this.belongsToMany(KnowledgeService);
  },
  facilities: function() {
    return this.belongsToMany(KnowledgeFacility);
  },
});

export const KnowledgeAnswerSchema = Joi.object({
  id: Joi.string(),
  question: Joi.string(),
  answer: Joi.string(),
  url: Joi.string(),
});
