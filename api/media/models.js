import { bookshelf } from '../orm';
import { Organization } from '../accounts/models';

export const Media = bookshelf.Model.extend({
  tableName: 'medias',
  organization() {
    return this.belongsTo(Organization, 'organization_id');
  },
});
