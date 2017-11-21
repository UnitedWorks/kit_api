import { Organization } from '../accounts/models';
import { bookshelf } from '../orm';

export const Vehicle = bookshelf.Model.extend({
  tableName: 'vehicles',
  hasTimeStamps: true,
  organization() {
    return this.belongsTo(Organization, 'organization_id');
  },
});
