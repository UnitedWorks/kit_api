import wkx from 'wkx';
import { bookshelf } from '../orm';
import { Place } from '../places/models';
import { Service } from '../services/models';

export const Availability = bookshelf.Model.extend({
  tableName: 'availabilitys',
  service() {
    return this.belongsTo(Service);
  },
  place() {
    return this.belongsTo(Place);
  },
  toJSON() {
    const attrs = bookshelf.Model.prototype.toJSON.apply(this, arguments);
    if (attrs.geo_rules) {
      const b = new Buffer(attrs.geo_rules, 'hex');
      const c = wkx.Geometry.parse(b).polygons
        .map(poly => poly.exteriorRing.map(point => [point.x, point.y]));
      attrs.geo_rules = {
        type: 'MultiPolygon',
        coordinates: c,
      };
    }
    return attrs;
  },
});
