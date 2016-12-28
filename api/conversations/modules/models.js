import Joi from 'joi';
import { bookshelf } from '../../bookshelf';

export const EngagementModule = bookshelf.Model.extend({
  tableName: 'EngagementModule',
  engagements: () => {
    return this.hasMany(Engagement)
  },
});

export const EngagementModuleSchema = Joi.object({
  // uuid
  id: Joi.string(),
  name: Joi.string(),
  description: Joi.string(),
  // Labels should be the prefix of actions/intents in the Api.AI system
  label: Joi.string().regex(/^[a-zA-Z]{3,24}&/),
  engagements: Joi.array().items(Joi.string()),
});

export const Engagement = bookshelf.Model.extend({
  tableName: 'Engagement',
});

export const EngagementSchema = Joi.object({
  // uuid
  id: Joi.string(),
  description: Joi.string(),
  // Engagement module
  module: Joi.string(),
  // Labels follow the engagement module's label with a '-' inbetween
  label: Joi.string()
  // Key for intent/action catching. Fallback label is for the base module
  intent: Joi.string(),
  fallbackIntent: Joi.string(),
  // Id of response
  response: Joi.string(),
});

export const EngagementResponse = bookshelf.Model.extend({
  tableName: 'EngagementResponse',
});

export const EngagementResponseSchema = Joi.object({
  // uuid
  id: Joi.string(),
  type: Joi.string().valid(['text', 'schedule']),
});
