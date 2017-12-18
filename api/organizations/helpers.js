import { Organization } from '../accounts/models';

export function createOrganization(org, options = { returnJSON: true }) {
  if (org.id) throw new Error('Has ID. Use Update');
  return Organization.forge(org).save(null, { method: 'insert' })
    .then((model) => {
      return model.refresh({ withRelated: ['address', 'integrations'] }).then((refreshedModel) => {
        return options.returnJSON ? refreshedModel.toJSON() : refreshedModel;
      });
    }).catch(error => error);
}

export function updateOrganization(org, options = { returnJSON: true }) {
  const cleanedOrg = {
    id: org.id,
    name: org.name,
    url: org.url,
    alternate_names: org.alternate_names,
    description: org.description,
  };
  return Organization.where({ id: cleanedOrg.id }).save(cleanedOrg, { patch: true, method: 'update' })
    .then((model) => {
      return model.refresh({ withRelated: ['address', 'integrations'] }).then((refreshedModel) => {
        return options.returnJSON ? refreshedModel.toJSON() : refreshedModel;
      });
    }).catch(error => error);
}
