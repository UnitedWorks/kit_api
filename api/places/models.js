import { bookshelf } from '../orm';
import { Location } from '../knowledge-base/models';

export const Place = bookshelf.Model.extend({
  tableName: 'places',
  location() {
    return this.belongsTo(Location, 'location_id');
  },
});
