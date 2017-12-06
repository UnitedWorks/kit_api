import { Place } from './models';
import { KnowledgeAnswer } from '../knowledge-base/models';
import { crudEntityAddresses } from '../geo/helpers';
import { crudEntityPhones } from '../phones/helpers';

export async function createPlace(place, organization, options) {
  const composedPlace = {
    name: place.name,
    alternate_names: place.alternate_names,
    brief_description: place.brief_description,
    description: place.description,
    url: place.url,
    availabilitys: place.availabilitys,
    functions: place.functions,
    organization_id: organization.id,
  };
  return Place.forge(composedPlace).save(null, { method: 'insert' })
    .then((placeData) => {
      crudEntityPhones({ place_id: placeData.id }, place.phones);
      crudEntityAddresses({ place_id: placeData.id }, place.addresses);
      return options.returnJSON ? placeData.toJSON() : placeData;
    })
    .catch(err => err);
}

export async function updatePlace(place, options) {
  const cleanedPlace = Object.assign({}, place);
  delete cleanedPlace.phones;
  delete cleanedPlace.addresses;
  return Place.where({ id: cleanedPlace.id }).save(cleanedPlace, { method: 'update', patch: true })
    .then((placeData) => {
      crudEntityPhones({ place_id: placeData.id }, place.phones);
      crudEntityAddresses({ place_id: placeData.id }, place.addresses);
      return options.returnJSON ? placeData.toJSON() : placeData;
    })
    .catch(err => err);
}

export function deletePlace(placeId) {
  return KnowledgeAnswer.where({ place_id: placeId }).destroy().then(() => {
    return Place.forge({ id: placeId }).destroy()
      .then(() => ({ id: placeId }))
      .catch(err => err);
  }).catch(err => err);
}
