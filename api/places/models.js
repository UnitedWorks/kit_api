import { bookshelf } from '../orm';
import { Address } from '../geo/models';
import { Phone } from '../phones/models';

export const Place = bookshelf.Model.extend({
  tableName: 'places',
  addresses() {
    return this.belongsToMany(Address, 'addresss_entity_associations', 'place_id', 'address_id');
  },
  phones() {
    return this.belongsToMany(Phone, 'phones_entity_associations');
  },
});
