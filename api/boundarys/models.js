import wkx from 'wkx';
import { bookshelf } from '../orm';

export const Boundary = bookshelf.Model.extend({
  tableName: 'boundarys',
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
