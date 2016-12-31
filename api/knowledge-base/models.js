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

export const KnowledgeFacility = bookshelf.Model.extend({
  tableName: 'knowledge_facilitys',
  category: () => this.hasOne(KnowledgeCategory, 'category_id'),
  schedule: () => this.hasOne(Schedule, 'schedule_id'),
  location: () => this.hasOne(Location, 'location_id'),
});

export const KnowledgeFacilitySchema = Joi.object({
  id: Joi.string(),
  name: Joi.string(),
  category: Joi.string().valid(KnowledgeConstants.FACILITY_CATEGORIES),
  description: Joi.string(),
});

export const KnowledgeService = bookshelf.Model.extend({
  tableName: 'knowledge_services',
  category: () => this.hasOne(KnowledgeCategory, 'category_id'),
  schedule: () => this.hasOne(Schedule, 'schedule_id'),
  location: () => this.hasOne(Location, 'location_id'),
  facility: () => this.hasOne(KnowledgeFacility, 'facility_id'),
});

export const KnowledgeServiceSchema = Joi.object({
  id: Joi.string(),
  name: Joi.string(),
  categories: Joi.array().items(Joi.string()),
  description: Joi.string(),
});

export const KnowledgeEvent = bookshelf.Model.extend({
  tableName: 'knowledge_events',
  schedule: () => this.hasOne(Schedule, 'schedule_id'),
  location: () => this.hasOne(Location, 'location_id'),
  facility: () => this.hasOne(KnowledgeFacility, 'facility_id'),
  service: () => this.hasOne(KnowledgeService, 'service_id'),
});

export const KnowledgeEventSchema = bookshelf.Model.extend({
  id: Joi.string(),
  name: Joi.string(),
  description: Joi.string(),
});

export const KnowledgeAnswer = bookshelf.Model.extend({
  tableName: 'knowledge_answers',
  category: () => this.hasOne(KnowledgeCategory, 'category_id'),
  // Setup relationship tables to get associated events, services, and facilities
  events: () => this.belongsToMany(KnowledgeEvent),
  services: () => this.belongsToMany(KnowledgeService),
  facilities: () => this.belongsToMany(KnowledgeFacility),
});

export const KnowledgeAnswerSchema = Joi.object({
  id: Joi.string(),
  question: Joi.string(),
  answer: Joi.string(),
  url: Joi.string(),
});
