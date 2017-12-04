import { bookshelf } from '../orm';
import { Location } from '../geo/models';

export const Event = bookshelf.Model.extend({
  tableName: 'events',
  location() {
    return this.hasOne(Location, 'id');
  },
});
