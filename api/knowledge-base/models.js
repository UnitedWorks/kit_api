import Joi from 'joi';
import { bookshelf } from '../orm';

export const KnowledgeBaseModule = bookshelf.Model.extend({
  tableName: 'KnowledgeBaseModule',
  items: () => {
    return this.hasMany(KnowledgeBaseListing);
  },
});

export const KnowledgeBaseModuleSchema = Joi.object({
  // uuid
  id: Joi.string(),
  name: Joi.string(),
  description: Joi.string(),
  // Items are
  items: Joi.array().items(),
});

export const KnowledgeBaseListing = bookshelf.Model.extend({
  tableName: 'KnowledgeBaseListing',
  entries: () => {
    return this.hasMany(KnowledgeBaseEntry);
  }
});

export const KnowledgeBaseListingSchema = Joi.object({
  // uuid
  id: Joi.string(),
  // Details
  name: Joi.string(),
  description: Joi.string(),
  type: Joi.string(), // BaseItem types? Services, events, facilities, questions?
  // Engagement module ID
  module: Joi.string(),
  // Entry IDs
  entries: Joi.array().items(Joi.string()),
});

export const KnowledgeBaseEntry = bookshelf.Model.extend({
  tableName: 'KnowledgeBaseEntry',
});

export const KnowledgeBaseEntrySchema = Joi.object({
  // uuid
  id: Joi.string(),
  // Corresponding KnowledgeBaseListing
  listing: Joi.string(),
});
