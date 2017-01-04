import Joi from 'joi';
import { bookshelf } from '../../orm';
import * as KnowledgeModels from '../models';
import * as AccountModels from '../../accounts/models';

// Narratives/Engagements
export const EngagementModule = bookshelf.Model.extend({
  tableName: 'engagement_modules',
});

export const EngagementModuleSchema = Joi.object({
  id: Joi.string(),
  name: Joi.string(),
  sponsor: Joi.string(),
});

export const EngagementIntent = bookshelf.Model.extend({
  tableName: 'engagement_intents',
  engagementModule: () => this.hasOne(EngagementModule, 'engagement_module_id'),
});

export const EngagementIntentSchema = Joi.object({
  id: Joi.string(),
  engagementModule: Joi.object(),
  intentToken: Joi.string(),
  intentName: Joi.string(),
  intentDescription: Joi.string(),
  hasQuery: Joi.boolean(),
  hasResponse: Joi.boolean(),
});

export const EngagementScript = bookshelf.Model.extend({
  tableName: 'engagement_scripts',
  organization: () => this.hasOne(AccountModels.Organization, 'organization_id'),
  engagementIntent: () => this.hasOne(EngagementIntent, ' engagement_intent_id'),
  answers: () => this.belongsToMany(KnowledgeModels.KnowledgeAnswer),
  events: () => this.belongsToMany(KnowledgeModels.KnowledgeEvent),
  facilities: () => this.belongsToMany(KnowledgeModels.KnowledgeFacility),
  services: () => this.belongsToMany(KnowledgeModels.KnowledgeService),
  // responsibleRepresentative: () => this.hasOne(AccountModels.Representat.ive, 'representative_id'), // Even if just a forwarding email is provided, we're creating an unconfirmed representative
});

export const EngagementScriptSchema = Joi.object({
  id: Joi.string(),
  organization: Joi.object(),
  engagementIntent: Joi.object(),
  queryType: Joi.string(),
  // responsibleRepresentative: Joi.object(),
});
