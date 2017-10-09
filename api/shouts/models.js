import { bookshelf } from '../orm';
import { Organization } from '../accounts/models';
import { Task } from '../tasks/models';

export const ShoutOut = bookshelf.Model.extend({
  tableName: 'shout_outs',
  hasTimeStamps: true,
  task() {
    return this.belongsTo(Task, 'task_id');
  },
});

export const ShoutOutTrigger = bookshelf.Model.extend({
  tableName: 'shout_out_triggers',
  organization() {
    return this.belongsTo(Organization, 'organization_id');
  },
});
