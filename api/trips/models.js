import wkx from 'wkx';
import { bookshelf, knex, st } from '../orm';
import { Vehicle } from '../vehicles/models';

export const Trip = bookshelf.Model.extend({
  tableName: 'trips',
  hasTimeStamps: true,
  vehicle() {
    return this.belongsTo(Vehicle, 'vehicle_id');
  },
});
