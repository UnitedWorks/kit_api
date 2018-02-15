import { knex } from '../orm';
import { Organization } from '../accounts/models';
import { crudEntityAddresses } from '../geo/helpers';
import { crudEntityAvailabilitys } from '../availabilitys/helpers';

export async function createOrganization(org, options = { returnJSON: true }) {
  if (org.id) throw new Error('Has ID. Use Update');
  const orgModel = await Organization.forge(org).save(null, { method: 'insert' }).then(o => o);
  if (org.addresses) await crudEntityAddresses({ organization_id: orgModel.id }, org.addresses);
  if (org.availabilitys) await crudEntityAvailabilitys({ organization_id: orgModel.id }, org.availabilitys);
  const refreshedOrg = await orgModel.refresh({ withRelated: ['address', 'addresses', 'integrations'] }).then(rf => rf);
  return options.returnJSON ? refreshedOrg.toJSON() : refreshedOrg;
}

export async function updateOrganization(org, options = { returnJSON: true }) {
  const cleanedOrg = {
    id: org.id,
    name: org.name,
    url: org.url,
    alternate_names: org.alternate_names,
    description: org.description,
  };
  const orgModel = await Organization.where({ id: cleanedOrg.id }).save(cleanedOrg, { patch: true, method: 'update' }).then(o => o);
  if (org.addresses) await crudEntityAddresses({ organization_id: orgModel.id }, org.addresses);
  if (org.availabilitys) await crudEntityAvailabilitys({ organization_id: orgModel.id }, org.availabilitys);
  const refreshedOrg = await orgModel.refresh({ withRelated: ['address', 'addresses', 'integrations', 'phones', 'persons', 'places', 'services'] }).then(rf => rf);
  return options.returnJSON ? refreshedOrg.toJSON() : refreshedOrg;
}

export function deleteOrganization(id) {
  return Promise.all([
    knex('addresss_entity_associations').where('organization_id', '=', id).del().then(p => p),
    knex('knowledge_answers').where('organization_id', '=', id).del().then(p => p),
    knex('organizations_entity_associations').where('organization_id', '=', id).del().then(p => p),
  ])
  .then(() => Organization.where({ id }).destroy().then(() => ({ id }))
  .catch(error => error)).catch(err => err);
}
