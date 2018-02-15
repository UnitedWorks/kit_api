import { knex } from '../orm';
import { Availability } from './models';

export function fixAvailabilityFormat(availability) {
  let formattedGeoRule = null;
  const preppedavailability = availability;
  if (availability.geo_rules) {
    const polygonStrings = [];
    availability.geo_rules.coordinates.forEach((polys) => {
      let polyString = '';
      polys.forEach((point, index) => {
        polyString += `${index !== 0 ? ',' : ''}${point[0]} ${point[1]}`;
      });
      polyString = `${polyString}, ${polys[0][0]} ${polys[0][1]}`;
      polygonStrings.push(`((${polyString}))`);
    });
    formattedGeoRule = knex.raw(`ST_GeomFromText('MULTIPOLYGON(${polygonStrings.join(', ')})',4326)`);
  }
  return {
    ...preppedavailability,
    geo_rules: formattedGeoRule,
  };
}

export async function crudEntityAvailabilitys(relation, availabilitys) {
  // A relation needs to exist
  if (!relation) return;
  // Get Availability Ids Where Relation Exists
  const existingAvailabilityIds = await knex.select('id').from('availabilitys').where(relation).then(ids => ids);
  // If no availabilitys exist, delete on the relation
  if (!availabilitys || availabilitys.length === 0) {
    // Remove Relations
    await knex('availabilitys').where(relation).del().then(d => d);
    // Remove Phones by ID
    return await Promise.all((existingAvailabilityIds || []).map(id => knex('availabilitys').where({ id }).del())).then(r => r);
  }
  // Create/Update All Availabilities, Returning IDs (Delete if no numbers exist)
  return await Promise.all(availabilitys.map((availability) => {
    if (availability.id && !availability.geo_rules && !availability.schedule_rules && !availability.constituent_rules) {
      return knex('availabilitys').where({ id: availability.id }).del().then(() => null);
    } else if (availability.id) {
      return Availability.where({ id: availability.id }).save(fixAvailabilityFormat({ ...availability, ...relation }), { method: 'update', patch: true }).then(a => a.id);
    } else if (!availability.id) {
      return Availability.forge(fixAvailabilityFormat({ ...availability, ...relation })).save(null, { method: 'insert' }).then(a => a.id);
    }
  })).then(ids => ids.filter(i => i));
}
