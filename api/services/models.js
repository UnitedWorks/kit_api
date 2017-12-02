import { bookshelf } from '../orm';
import { Location } from '../knowledge-base/models';

export const Service = bookshelf.Model.extend({
  tableName: 'services',
  location() {
    return this.belongsTo(Location, 'location_id');
  },
});
