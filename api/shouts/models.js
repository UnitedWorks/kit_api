import { bookshelf } from '../orm';
import { Organization } from '../accounts/models';

export const ShoutOut = bookshelf.Model.extend({
  tableName: 'shout_outs',
  hasTimeStamps: true,
});

export const ShoutOutTrigger = bookshelf.Model.extend({
  tableName: 'shout_out_triggers',
  organization() {
    return this.belongsTo(Organization, 'organization_id');
  },
});
