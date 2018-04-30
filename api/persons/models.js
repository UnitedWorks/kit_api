import { bookshelf } from '../orm';
import { Organization } from '../accounts/models';
import { Phone } from '../phones/models';
import { Boundary } from '../boundarys/models';

export const Person = bookshelf.Model.extend({
  tableName: 'persons',
  hasTimestamps: true,
  organizations() {
    return this.belongsToMany(Organization, 'organizations_entity_associations');
  },
  phones() {
    return this.belongsToMany(Phone, 'phones_entity_associations');
  },
  boundarys() {
    return this.belongsToMany(Boundary, 'boundarys_entity_associations');
  },
});
