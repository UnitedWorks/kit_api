import Joi from 'joi';
import { bookshelf } from '../bookshelf';
import * as conversations from '../conversations/models';

export const Organization = bookshelf.Model.extend({
  tableName: 'Organization',
  conversations: () => {
    return this.hasMany(conversations.Conversation);
  },
});

export const OrganizationSchema = Joi.object({
  // UUID
  id: Joi.string(),
  name: Joi.string(),
  parent: Joi.array().items(Joi.string()),
  children: Joi.array().items(Joi.string()),
  representatives: Joi.array().items(Joi.string()),
  // Conversations
  conversations: Joi.array().items(Joi.string()),
});

export const User = bookshelf.Model.extend({
  tableName: 'User',
});

export const UserSchema = Joi.object({
  // UUID
  id: Joi.string(),
  // Account
  username: Joi.string().alphanum().min(3).max(30),
  email: Joi.string(),
  password: Joi.string(),
  salt: Joi.string(),
  name: Joi.string(),
  joined: Joi.date(),
  organization: Joi.string(),
  // A non-verified user
  verified: Joi.boolean(),
});
