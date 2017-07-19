import { bookshelf } from '../orm';
import { Constituent, Representative, Organization } from '../accounts/models';

export const Task = bookshelf.Model.extend({
  tableName: 'tasks',
  hasTimeStamps: true,
  representatives: function() {
    return this.belongsToMany(Representative, 'tasks_respresentatives');
  },
  constituent: function() {
    return this.belongsTo(Constituent, 'constituent_id');
  },
  organization: function() {
    return this.belongsTo(Organization, 'organization_id');
  },
});
