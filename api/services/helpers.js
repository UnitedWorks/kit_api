import { Service } from './models';
import { KnowledgeAnswer } from '../knowledge-base/models';
import { createLocation } from '../knowledge-base/helpers';

export async function createService(service, organization, location, options) {
  const composedService = {
    name: service.name,
    brief_description: service.brief_description,
    description: service.description,
    phone_number: service.phone_number,
    url: service.url,
    organization_id: organization.id,
    availabilitys: service.availabilitys,
    functions: service.functions,
    alternate_names: service.alternate_names,
  };
  // Set Location
  if (location) {
    const locationJSON = await createLocation(location, { returnJSON: true });
    if (locationJSON) composedService.location_id = locationJSON.id;
  }
  return Service.forge(composedService).save(null, { method: 'insert' })
    .then(serviceData => (options.returnJSON ? serviceData.toJSON() : serviceData))
    .catch(err => err);
}

export async function updateService(service, options) {
  const compiledService = {
    id: service.id,
    name: service.name,
    brief_description: service.brief_description,
    description: service.description,
    eligibility_information: service.eligibility_information,
    phone_number: service.phone_number,
    url: service.url,
    availabilitys: service.availabilitys,
    location_id: service.location_id,
    functions: service.functions,
    alternate_names: service.alternate_names,
  };
  // Create location if it was passed without an ID
  if (service.location && !service.location.id) {
    const locationJSON = await createLocation(service.location, { returnJSON: true });
    if (locationJSON) compiledService.location_id = locationJSON.id;
  }
  return Service.forge(compiledService).save(null, { method: 'update' })
    .then(serviceData => (options.returnJSON ? serviceData.toJSON() : serviceData))
    .catch(err => err);
}

export function deleteService(serviceId) {
  return KnowledgeAnswer.where({ service_id: serviceId }).destroy().then(() => {
    return Service.forge({ id: serviceId }).destroy().then(() => {
      return { id: serviceId };
    }).catch(err => err);
  }).catch(err => err);
}
