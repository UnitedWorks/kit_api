import { Organization } from '../accounts/models';
import { bookshelf } from '../orm';

export const Feed = bookshelf.Model.extend({
  tableName: 'feeds',
  hasTimeStamps: true,
  organization() {
    return this.belongsTo(Organization, 'organization_id');
  },
});
