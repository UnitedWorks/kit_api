import { bookshelf } from '../orm';
import { Location } from '../knowledge-base/models';
import { Phone } from '../phones/models';

export const Service = bookshelf.Model.extend({
  tableName: 'services',
  location() {
    return this.belongsTo(Location, 'location_id');
  },
  phones() {
    return this.belongsToMany(Phone, 'phones_entity_associations');
  },
});
