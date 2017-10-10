import { bookshelf } from '../orm';
import { Constituent, Organization } from '../accounts/models';
import { ShoutOut } from '../shouts/models';

export const Task = bookshelf.Model.extend({
  tableName: 'tasks',
  hasTimeStamps: true,
  constituent() {
    return this.belongsTo(Constituent, 'constituent_id');
  },
  organization() {
    return this.belongsTo(Organization, 'organization_id');
  },
  shout_outs() {
    return this.hasMany(ShoutOut, 'task_id');
  },
});
