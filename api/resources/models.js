import { bookshelf } from '../orm';
import { Media } from '../media/models';
import { Organization } from '../accounts/models';

export const Resource = bookshelf.Model.extend({
  tableName: 'resources',
  media() {
    return this.belongsToMany(Media, 'resources_medias');
  },
  organization() {
    return this.belongsTo(Organization, 'organization_id');
  },
});
