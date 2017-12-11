import { Service } from './models';
import { KnowledgeAnswer } from '../knowledge-base/models';
import { crudEntityPhones } from '../phones/helpers';

export async function createService(service, organization, location, options) {
  const composedService = {
    name: service.name,
    description: service.description,
    url: service.url,
    organization_id: organization.id,
    availabilitys: service.availabilitys,
    functions: service.functions,
    alternate_names: service.alternate_names,
  };
  return Service.forge(composedService).save(null, { method: 'insert' })
    .then((serviceData) => {
      crudEntityPhones({ service_id: serviceData.id }, service.phones);
      return options.returnJSON ? serviceData.toJSON() : serviceData;
    })
    .catch(err => err);
}

export async function updateService(service, options) {
  const compiledService = {
    id: service.id,
    name: service.name,
    description: service.description,
    url: service.url,
    availabilitys: service.availabilitys,
    location_id: service.location_id,
    functions: service.functions,
    alternate_names: service.alternate_names,
  };
  return Service.forge(compiledService).save(null, { method: 'update' })
    .then((serviceData) => {
      crudEntityPhones({ service_id: serviceData.id }, service.phones);
      return options.returnJSON ? serviceData.toJSON() : serviceData;
    })
    .catch(err => err);
}

export function deleteService(serviceId) {
  return KnowledgeAnswer.where({ service_id: serviceId }).destroy().then(() => {
    return Service.forge({ id: serviceId }).destroy().then(() => {
      return { id: serviceId };
    }).catch(err => err);
  }).catch(err => err);
}
