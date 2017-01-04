import Joi from 'joi';
import { bookshelf } from '../orm';
import * as interfaces from '../constants/interfaces';
import * as accounts from '../accounts/models';
import * as knowledge from '../knowledge-base/models';

// Conversations
export const Message = bookshelf.Model.extend({
  tableName: 'Message',
  attachments: () => this.hasMany(Attachment, 'message_id')
});

export const MessageSchema = Joi.object({
  // UUID
  id: Joi.string(),
  // Associated conversation id
  conversation: Joi.string(),
  // Ids of sender and recipient
  recipient: Joi.string(),
  sender: Joi.string(),
  time: Joi.date(),
  text: Joi.string(),
  // Keep a number sequence
  sequence: Joi.number(),
  // Attachment details
  attachments: Joi.array(),
});

export const Conversation = bookshelf.Model.extend({
  tableName: 'Conversation',
  messages: () => this.hasMany(Message, 'message_id'),
});

export const ConversationSchema = Joi.object({
  // UUID
  id: Joi.string(),
  // What platform is this taking place on
  interface: Joi.string().valid([interfaces.FACEBOOK]),
  // What messages are part of this
  messages: Joi.array().items(Joi.string()),
  started: Joi.date(),
  assigned: Joi.string(),
});

export const Attachment = bookshelf.Model.extend({
  tableName: 'Attachment',
  message: () => this.belongsTo(Message, 'message_id'),
  media: () => this.hasOne(knowledge.Media, 'media_id'),
});

export const AttachmentSchema = Joi.object({
  title: Joi.string(),
});
