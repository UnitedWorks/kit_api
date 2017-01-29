import { Organization, Representative } from './models';

export const createOrganization = (organizationModel, options = {}) => {
  return new Promise((resolve, reject) => {
    Organization.forge(organizationModel).save(null, { method: 'insert' })
      .then(model => resolve(options.returnJSON ? model.toJSON() : model))
      .catch(err => reject(err));
  });
};

export const createRepresentative = (rep, org, options = {}) => {
  return new Promise((resolve, reject) => {
    let repObj = rep;
    if (org) {
      repObj = Object.assign(rep, { organization_id: org.id });
    }
    Representative.forge(repObj).save(null, { method: 'insert' })
      .then((createdRep) => {
        if (!org) {
          resolve(options.returnJSON ? createdRep.toJSON() : createdRep);
        } else {
          createdRep.refresh({ withRelated: ['organization'] })
            .then((populatedRep) => {
              resolve(options.returnJSON ? populatedRep.toJSON() : populatedRep);
            })
            .catch(err => reject(err));
        }
      }).catch(err => reject(err));
  });
};

export const updateRepresentative = (update, options) => {
  return new Promise((resolve, reject) => {
    const filter = {};
    if (update.id) filter.id = update.id;
    if (update.email) filter.email = update.email;
    Representative.where(filter).save(update, { patch: true, method: 'update' })
      .then((updatedRepModel) => {
        resolve(options.returnJSON ? updatedRepModel.toJSON() : updatedRepModel);
      }).catch(err => reject(err));
  });
};

export const addRepToOrganization = (rep, org, options) => {
  if (!rep.id) return createRepresentative(rep, org, options);
  return new Promise((resolve, reject) => {
    Representative.where({ id: rep.id }).save({ organization_id: org.id }, { patch: true, method: 'update' })
      .then((updatedRepModel) => {
        resolve(options.returnJSON ? updatedRepModel.toJSON() : updatedRepModel);
      }).catch(err => reject(err));
  });
};
