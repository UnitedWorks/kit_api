import { knex } from '../orm';
import { Vehicle } from './models';

export async function lookupActiveVehicles(vehicleFunction, orgId) {
  const params = {
    organization_id: orgId,
  };
  if (vehicleFunction) params.function = vehicleFunction;
  const vehicles = await Vehicle.query((qb) => {
    qb.where(params)
      .andWhere(knex.raw("DATE_PART('Day',now() - last_active_at::timestamptz) < 1"));
  }).fetchAll().then(v => v.toJSON());
  return {
    vehicles,
  };
}
