import { knex } from '../orm';
import { logger } from '../logger';
import { Organization, Representative } from './models';

export const createOrganization = (organizationModel, options = {}) => {
  return new Promise((resolve, reject) => {
    Organization.forge(organizationModel).save(null, { method: 'insert' })
      .then(model => resolve(options.returnJSON ? model.toJSON() : model))
      .catch(err => reject(err));
  });
};

export const getAdminOrganizationAtLocation = (geoData, options = {}) => {
  return new Promise((resolve, reject) => {
    const subquery = knex('locations')
      .select('id')
      .where('city', '=', geoData.city)
      .whereRaw("administrative_levels->>'level1short'=?", geoData.administrativeLevels.level1short)
      .whereRaw("administrative_levels->>'level2short'=?", geoData.administrativeLevels.level2short);
    knex.select('*').from('organizations').whereIn('location_id', subquery)
      .then((res) => {
        if (res.length === 1) {
          const orgJSON = JSON.parse(JSON.stringify(res[0]));
          Organization.where({ id: orgJSON.id }).fetch({ withRelated: ['location'] })
            .then((model) => {
              resolve(options.returnJSON ? model.toJSON() : model);
            });
        } else {
          resolve(null);
        }
      })
      .catch(error => reject(error));
  });
};

export const checkForAdminOrganizationAtLocation = (geoData) => {
  return new Promise((resolve, reject) => {
    knex('organizations')
      .select('*')
      .join('locations', 'organizations.location_id', 'locations.id')
      .where('city', '=', geoData.city)
      .whereRaw("administrative_levels->>'level1short'=?", geoData.administrativeLevels.level1short)
      .whereRaw("administrative_levels->>'level2short'=?", geoData.administrativeLevels.level2short)
      .then((res) => {
        if (res.length > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .catch(error => reject(error));
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
      }).catch((err) => {
        logger.error(err);
        reject('This email looks like its in use, contact us with further issues.');
      });
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
