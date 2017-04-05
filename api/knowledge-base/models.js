import lodash from 'lodash';
import { bookshelf } from '../orm';
import { Organization } from '../accounts/models';
import { Media } from '../media/models';

// Information Entries - Referenced in knowledge and non-knowledge base tables
export const Location = bookshelf.Model.extend({
  tableName: 'locations',
});

export const EventRule = bookshelf.Model.extend({
  tableName: 'event_rules',
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
  type: function() {
    return this.belongsTo(KnowledgeFacilityType, 'type_id');
  },
  location: function() {
    return this.belongsTo(Location, 'location_id');
  },
  events: function() {
    return this.hasMany(KnowledgeEvent, 'knowledge_facility_id');
  },
  eventRules: function() {
    return this.hasMany(EventRule, 'knowledge_facility_id');
  },
  services: function() {
    return this.hasMany(KnowledgeService, 'knowledge_facility_id');
  },
});

export const KnowledgeService = bookshelf.Model.extend({
  tableName: 'knowledge_services',
  category: function() {
    return this.belongsTo(KnowledgeCategory, 'knowledge_category_id');
  },
  events: function() {
    return this.hasMany(KnowledgeEvent, 'knowledge_service_id');
  },
  facility: function() {
    return this.belongsTo(KnowledgeFacility, 'knowledge_facility_id');
  },
  location: function() {
    return this.belongsTo(Location, 'location_id');
  },
  eventRules: function() {
    return this.hasMany(EventRule, 'knowledge_service_id');
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
  eventRules: function() {
    return this.hasMany(EventRule, 'knowledge_event_id');
  },
  service: function() {
    return this.belongsTo(KnowledgeService, 'knowledge_service_id');
  },
});

export const KnowledgeContact = bookshelf.Model.extend({
  tableName: 'knowledge_contacts',
  hasTimestamps: true,
  virtuals: {
    full_name: {
      get() {
        if (this.get('middle_name')) {
          return `${this.get('first_name')} ${this.get('middle_name')} ${this.get('last_name')}`;
        } else if (this.get('first_name') && this.get('last_name')) {
          return `${this.get('first_name')} ${this.get('last_name')}`;
        }
        return this.get('first_name');
      },
    },
  },
  photo: function() {
    return this.hasOne(Media, 'photo_id');
  },
});

export const KnowledgeQuestion = bookshelf.Model.extend({
  tableName: 'knowledge_questions',
  hasTimestamps: true,
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
  facility: function() {
    return this.hasOne(KnowledgeFacility, 'id', 'knowledge_facility_id');
  },
  service: function() {
    return this.hasOne(KnowledgeService, 'id', 'knowledge_service_id');
  },
  contact: function() {
    return this.hasOne(KnowledgeContact, 'id', 'knowledge_contact_id');
  },
});
