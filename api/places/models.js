import { bookshelf } from '../orm';
import { Location } from '../knowledge-base/models';
import { Phone } from '../phones/models';

export const Place = bookshelf.Model.extend({
  tableName: 'places',
  location() {
    return this.belongsTo(Location, 'location_id');
  },
  phones() {
    return this.belongsToMany(Phone, 'phones_entity_associations');
  },
});
