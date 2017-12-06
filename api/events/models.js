import { bookshelf } from '../orm';
import { Address } from '../geo/models';

export const Event = bookshelf.Model.extend({
  tableName: 'events',
  address() {
    return this.belongsTo(Address, 'addresss_entity_associations', 'event_id', 'address_id');
  },
});
