import wkx from 'wkx';
import { Organization } from '../accounts/models';
import { bookshelf } from '../orm';

export const Vehicle = bookshelf.Model.extend({
  tableName: 'vehicles',
  hasTimeStamps: true,
  organization() {
    return this.belongsTo(Organization, 'organization_id');
  },
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
