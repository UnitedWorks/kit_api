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
  parentOrganization: () => this.hasOne(Organization, 'parent_organization_id'),
  childOrganizations: () => {
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
  phone: Joi.string(),
  password: Joi.string(),
  salt: Joi.string(),
  organizationId: Joi.string(),
  emailConfirmed: Joi.boolean(), // False if hasn't verified (ex: was invited)
  createdAt: Joi.date(),
});

export const ConstituentSchema = Joi.object({
  // UUID
  id: Joi.string(),
  // Account
  email: Joi.string().email(),
  phone: Joi.string(),
  facebookId: Joi.string(),
  twitterId: Joi.string(),
  twitterHandle: Joi.string(),
  // conversations: Joi.array().items(Joi.string()),
  createdAt: Joi.date(),
});

export const OrganizationSchema = Joi.object({
  // UUID
  id: Joi.string(),
  name: Joi.string(),
  abbreviation: Joi.string(),
  email: Joi.string().email(),
  phone: Joi.string(),
  // Org Structure
  representatives: Joi.array(),
  parentOrganization: Joi.array().items(Joi.string()),
  childOrganizations: Joi.array().items(Joi.string()),
  // Conversations
  // conversations: Joi.array().items(Joi.string()),
  createdAt: Joi.date(),
});
