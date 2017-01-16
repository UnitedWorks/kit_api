import { Organization } from './models';

export const saveOrganization = (organizationModel) => {
  return new Promise((resolve, reject) => {
    Organization.forge(organizationModel).save()
      .then(model => resolve(model))
      .catch(err => reject(err));
  });
};
