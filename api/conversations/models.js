import { bookshelf } from '../orm';

// Message Entry - The point a message comes in from
export const MessageEntry = bookshelf.Model.extend({
  tableName: 'message_entrys',
});
