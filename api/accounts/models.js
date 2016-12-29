import Joi from 'joi';
import { bookshelf } from '../orm';
// import * as conversations from '../conversations/models';

export const Representative = bookshelf.Model.extend({
  tableName: 'representatives',
  organization: () => this.belongsTo(Organization, 'organization_id'),
});

export const Constituent = bookshelf.Model.extend({
  tableName: 'constituents',
  // conversations: () => this.hasMany(conversations.Conversation),
});

export const Organization = bookshelf.Model.extend({
  tableName: 'organizations',
  representatives: () => this.hasMany(Representative, 'organization_id'),
  parent_organization: () => this.hasOne(Organization, 'parent_organization_id'),
  child_organizations: () => {
    return this.hasMany(Organization).query({ where: { 'parent_organization_id': 'id' } });
  },
  // conversations: () => this.hasMany(conversations.Conversation),
});

export const RepresentativeSchema = Joi.object({
  // UUID
  id: Joi.string(),
  // Account
  name: Joi.string(),
  email: Joi.string().email(),
  password: Joi.string(),
  salt: Joi.string(),
  joined: Joi.date(),
  organization: Joi.string(),
  // A non-verified user
  verified: Joi.boolean(),
});

export const ConstituentSchema = Joi.object({
  // UUID
  id: Joi.string(),
  // Account
  facebookId: Joi.string(),
  twitterId: Joi.string(),
  twitterHandle: Joi.string(),
  email: Joi.string().email(),
  // conversations: Joi.array().items(Joi.string()),
});

export const OrganizationSchema = Joi.object({
  // UUID
  id: Joi.string(),
  name: Joi.string(),
  abbreviation: Joi.string(),
  email: Joi.string().email(),
  phone: Joi.string(),
  // Org Structure
  parent: Joi.array().items(Joi.string()),
  children: Joi.array().items(Joi.string()),
  // Associated Users
  representatives: Joi.array().items(Joi.string()),
  // Conversations
  // conversations: Joi.array().items(Joi.string()),
});
