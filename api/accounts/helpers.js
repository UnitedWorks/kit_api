import { Organization, Representative } from './models';

export const createOrganization = (organizationModel) => {
  return new Promise((resolve, reject) => {
    Organization.forge(organizationModel).save(null, { method: 'insert' })
      .then(model => resolve(model))
      .catch(err => reject(err));
  });
};

export const createRepresentative = (rep, org) => {
  return new Promise((resolve, reject) => {
    let newRepresentative = rep;
    if (org) {
      newRepresentative = Object.assign(rep, { organization_id: org.id });
    }
    Representative.forge(rep).save(null, { method: 'insert' })
      .then(model => resolve(model))
      .catch(err => reject(err));
  });
}
