import { bookshelf } from '../orm';
import { Availability } from '../availabilitys/models';
import { Address } from '../geo/models';
import { Phone } from '../phones/models';

export const Service = bookshelf.Model.extend({
  tableName: 'services',
  addresses() {
    return this.belongsToMany(Address, 'addresss_entity_associations', 'service_id', 'address_id');
  },
  phones() {
    return this.belongsToMany(Phone, 'phones_entity_associations');
  },
  availabilitys() {
    return this.hasMany(Availability, 'service_id');
  },
});
