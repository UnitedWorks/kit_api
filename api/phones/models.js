import { bookshelf } from '../orm';
import { Organization } from '../accounts/models';

export const Phone = bookshelf.Model.extend({
  tableName: 'phones',
  organization() {
    return this.belongsTo(Organization, 'organization_id');
  },
});
