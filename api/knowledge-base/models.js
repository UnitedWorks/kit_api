import Joi from 'joi';
import { bookshelf } from '../../bookshelf';

export const KnowledgeBaseModule = bookshelf.Model.extend({
  tableName: 'KnowledgeBaseModule',
  items: () => {
    return this.hasMany(KnowledgeBaseItem);
  },
});

export const KnowledgeBaseModuleSchema = Joi.object({
  // uuid
  id: Joi.string(),
  name: Joi.string(),
  description: Joi.string(),
  // Labels should be the prefix of actions/intents in the Api.AI system
  items: Joi.array().items(),
});

export const KnowledgeBaseItem = bookshelf.Model.extend({
  tableName: 'KnowledgeBaseItem',
  entries: () => {
    return this.hasMany(KnowledgeBaseEntry);
  }
});

export const KnowledgeBaseItemSchema = Joi.object({
  // uuid
  id: Joi.string(),
  // Details
  name: Joi.string(),
  description: Joi.string(),
  type: Joi.string(), // BaseItem types? Services, events, facilities, questions?
  // Engagement module ID
  module: Joi.string(),
  entries: Joi.array(),
});

export const KnowledgeBaseEntry = bookshelf.Model.extend({
  tableName: 'KnowledgeBaseEntry',
});

export const KnowledgeBaseEntrySchema = Joi.object({
  // uuid
  id: Joi.string(),
  // Corresponding KnowledgeBaseItem
  item: Joi.string(),
});
