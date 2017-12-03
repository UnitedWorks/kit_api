import { Place } from './models';
import { KnowledgeAnswer } from '../knowledge-base/models';
import { createLocation } from '../knowledge-base/helpers';
import { crudEntityPhones } from '../phones/helpers';

export async function createPlace(place, organization, location, options) {
  const composedPlace = {
    name: place.name,
    brief_description: place.brief_description,
    description: place.description,
    url: place.url,
    organization_id: organization.id,
    availabilitys: place.availabilitys,
    functions: place.functions,
    alternate_names: place.alternate_names,
  };
  // Set Location
  if (location) {
    const locationJSON = await createLocation(location, { returnJSON: true });
    if (locationJSON) composedPlace.location_id = locationJSON.id;
  }
  return Place.forge(composedPlace).save(null, { method: 'insert' })
    .then((placeData) => {
      crudEntityPhones({ place_id: placeData.id }, place.phones);
      return options.returnJSON ? placeData.toJSON() : placeData;
    })
    .catch(err => err);
}

export async function updatePlace(place, options) {
  const compiledPlace = {
    id: place.id,
    name: place.name,
    brief_description: place.brief_description,
    description: place.description,
    url: place.url,
    availabilitys: place.availabilitys,
    location_id: place.location_id,
    functions: place.functions,
    alternate_names: place.alternate_names,
  };
  // Create location if it was passed without an ID
  if (place.location && !place.location.id) {
    const locationJSON = await createLocation(place.location, { returnJSON: true });
    if (locationJSON) compiledPlace.location_id = locationJSON.id;
  }
  return Place.forge(compiledPlace).save(null, { method: 'update' })
    .then((placeData) => {
      crudEntityPhones({ place_id: placeData.id }, place.phones);
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
