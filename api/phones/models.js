import { bookshelf } from '../orm';
import { Organization } from '../accounts/models';

export const Phone = bookshelf.Model.extend({
  tableName: 'phones',
  hidden: ['_pivot_phone_id', '_pivot_service_id', '_pivot_place_id'],
  organization() {
    return this.belongsTo(Organization, 'organization_id');
  },
});
