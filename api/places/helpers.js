import { knex } from '../orm';
import { Place } from './models';
import { crudEntityAddresses } from '../geo/helpers';
import { crudEntityPhones } from '../phones/helpers';
import { crudEntityAvailabilitys } from '../availabilitys/helpers';

export async function createPlace(place, organization, options) {
  const composedPlace = {
    name: place.name,
    alternate_names: place.alternate_names,
    description: place.description,
    url: place.url,
    functions: place.functions,
    organization_id: organization.id,
  };
  return Place.forge(composedPlace).save(null, { method: 'insert' })
    .then((placeData) => {
      crudEntityPhones({ place_id: placeData.id }, place.phones);
      crudEntityAddresses({ place_id: placeData.id }, place.addresses);
      crudEntityAvailabilitys({ place_id: placeData.id }, place.availabilitys);
      return options.returnJSON ? placeData.toJSON() : placeData;
    })
    .catch(err => err);
}

export async function updatePlace(place, options) {
  const cleanedPlace = Object.assign({}, place);
  delete cleanedPlace.phones;
  delete cleanedPlace.addresses;
  delete cleanedPlace.availabilitys
  return Place.where({ id: cleanedPlace.id }).save(cleanedPlace, { method: 'update', patch: true })
    .then((placeData) => {
      crudEntityPhones({ place_id: placeData.id }, place.phones);
      crudEntityAddresses({ place_id: placeData.id }, place.addresses);
      crudEntityAvailabilitys({ place_id: placeData.id }, place.availabilitys);
      return options.returnJSON ? placeData.toJSON() : placeData;
    })
    .catch(err => err);
}

export function deletePlace(id) {
  return Promise.all([
    knex('addresss_entity_associations').where('place_id', '=', id).del().then(p => p),
    knex('knowledge_answers').where('place_id', '=', id).del().then(p => p),
    knex('organizations_entity_associations').where('place_id', '=', id).del().then(p => p),
    knex('phones_entity_associations').where('place_id', '=', id).del().then(p => p),
  ])
  .then(() => Place.where({ id }).destroy().then(() => ({ id }))
  .catch(error => error)).catch(err => err);
}
