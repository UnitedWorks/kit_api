import wkx from 'wkx';
import { bookshelf } from '../orm';

export const Address = bookshelf.Model.extend({
  tableName: 'addresss',
  toJSON() {
    const attrs = bookshelf.Model.prototype.toJSON.apply(this, arguments);
    if (attrs.location) {
      const b = new Buffer(attrs.location, 'hex');
      const c = wkx.Geometry.parse(b);
      attrs.location = {
        type: 'Point',
        coordinates: [c.x, c.y],
      };
    }
    return attrs;
  },
});
