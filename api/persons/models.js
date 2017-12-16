import { bookshelf } from '../orm';
import { Organization } from '../accounts/models';
import { Phone } from '../phones/models';

export const Person = bookshelf.Model.extend({
  tableName: 'persons',
  hasTimestamps: true,
  organization() {
    return this.belongsTo(Organization, 'organization_id');
  },
  phones() {
    return this.belongsToMany(Phone, 'phones_entity_associations');
  },
});
