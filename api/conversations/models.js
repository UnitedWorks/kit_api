import { bookshelf } from '../orm';
import * as AccountModels from '../accounts/models';

// Message Entry - The point a message comes in from
export const MessageEntry = bookshelf.Model.extend({
  tableName: 'message_entrys',
  organization() {
    return this.belongsTo(AccountModels.Organization, 'organization_id');
  },
});
