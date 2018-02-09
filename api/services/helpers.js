import { knex } from '../orm';
import { Service } from './models';
import { crudEntityPhones } from '../phones/helpers';
import { crudEntityAvailabilitys } from '../availabilitys/helpers';

export async function createService(service, organization, location, options) {
  const composedService = {
    name: service.name,
    description: service.description,
    url: service.url,
    organization_id: organization.id,
    functions: service.functions,
    alternate_names: service.alternate_names,
  };
  return Service.forge(composedService).save(null, { method: 'insert' })
    .then((serviceData) => {
      crudEntityPhones({ service_id: serviceData.id }, service.phones);
      crudEntityAvailabilitys({ service_id: serviceData.id }, service.availabilitys);
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
    location_id: service.location_id,
    functions: service.functions,
    alternate_names: service.alternate_names,
  };
  return Service.forge(compiledService).save(null, { method: 'update' })
    .then((serviceData) => {
      crudEntityPhones({ service_id: serviceData.id }, service.phones);
      crudEntityAvailabilitys({ service_id: serviceData.id }, service.availabilitys);
      return options.returnJSON ? serviceData.toJSON() : serviceData;
    })
    .catch(err => err);
}

export function deleteService(id) {
  return Promise.all([
    knex('addresss_entity_associations').where('service_id', '=', id).del().then(p => p),
    knex('knowledge_answers').where('service_id', '=', id).del().then(p => p),
    knex('organizations_entity_associations').where('service_id', '=', id).del().then(p => p),
    knex('phones_entity_associations').where('service_id', '=', id).del().then(p => p),
    knex('availabilitys').where('service_id', '=', id).del().then(p => p),
  ])
  .then(() => Service.where({ id }).destroy().then(() => ({ id }))
  .catch(error => error)).catch(err => err);
}
