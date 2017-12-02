import { bookshelf } from '../orm';
import { Location } from '../knowledge-base/models';

export const Event = bookshelf.Model.extend({
  tableName: 'events',
  location() {
    return this.hasOne(Location, 'id');
  },
});
