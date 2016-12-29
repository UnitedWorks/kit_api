import Joi from 'joi';
import { bookshelf } from '../orm';
import * as accounts from '../accounts/models';
import * as interfaces from '../constants/interfaces'

export const Conversation = bookshelf.Model.extend({
  tableName: 'Conversation',
  messages: () => {
    return this.hasMany(Message);
  }
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

export const Message = bookshelf.Model.extend({
  tableName: 'Message',
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
  attachment: Joi.array().items(Joi.string()),
});

export const Attachment = bookshelf.Model.extend({
  tableName: 'Attachment',
});

export const AttachmentSchema = Joi.object({
  title: Joi.string(),
  url: Joi.string(),
  type: Joi.string().valid(['image', 'audio', 'video', 'file', 'location']),
  payload: Joi.object(),
});
