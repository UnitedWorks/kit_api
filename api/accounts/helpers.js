import { knex } from '../orm';
import { Constituent, Organization, Representative } from './models';

export const createOrganization = (organizationModel, options = {}) => {
  return Organization.forge(organizationModel).save(null, { method: 'insert' }).then((model) => {
    return model.refresh({ withRelated: ['location', 'integrations'] }).then((refreshedModel) => {
      return options.returnJSON ? refreshedModel.toJSON() : refreshedModel;
    });
  }).catch(error => error);
};

export const getAdminOrganizationAtLocation = (geoData, options = {}) => {
  let subquery = knex('locations')
    .select('id')
    .whereRaw("address->>'state'=?", geoData.address.state);
  if (geoData.address.city) {
    subquery = subquery.whereRaw("address->>'city'=?", geoData.address.city);
  } else if (geoData.address.town) {
    subquery = subquery.whereRaw("address->>'town'=?", geoData.address.town);
  }
  return knex.select('*').from('organizations').whereIn('location_id', subquery)
    .then((res) => {
      if (res.length === 1) {
        const orgJSON = JSON.parse(JSON.stringify(res[0]));
        return Organization.where({ id: orgJSON.id })
          .fetch({ withRelated: ['location', 'integrations'] })
          .then(model => options.returnJSON ? model.toJSON() : model);
      }
      return null;
    })
    .catch(error => error);
};

export const checkForAdminOrganizationAtLocation = (geoData) => {
  let query = knex('organizations').select('*')
    .join('locations', 'organizations.location_id', 'locations.id');
  if (geoData.address.city) {
    query = query.whereRaw("address->>'city'=?", geoData.address.city);
  } else if (geoData.address.town) {
    query = query.whereRaw("address->>'town'=?", geoData.address.town);
  }
  return query.then((res) => {
    if (res.length > 0) {
      return true;
    }
    return false;
  }).catch(error => error);
};

export const createRepresentative = (rep, org, options = {}) => {
  let repObj = rep;
  if (org) {
    repObj = Object.assign(rep, { organization_id: org.id });
  }
  return Representative.forge(repObj).save(null, { method: 'insert' })
    .then((createdRep) => {
      if (!org) {
        return options.returnJSON ? createdRep.toJSON() : createdRep;
      }
      return createdRep.refresh({ withRelated: ['organization'] })
        .then((populatedRep) => {
          return options.returnJSON ? populatedRep.toJSON() : populatedRep;
        }).catch((error) => {
          throw new Error(error);
        });
    }).catch((error) => {
      throw new Error(error);
    });
};

export const updateRepresentative = (update, options) => {
  const filter = {};
  if (update.id) filter.id = update.id;
  if (update.email) filter.email = update.email;
  return Representative.where(filter).save(update, { patch: true, method: 'update' })
    .then((updatedRepModel) => {
      return options.returnJSON ? updatedRepModel.toJSON() : updatedRepModel;
    }).catch(err => err);
};

export const addRepToOrganization = (rep, org, options) => {
  if (!rep.id) return createRepresentative(rep, org, options);
  return Representative.where({ id: rep.id }).save({ organization_id: org.id }, { patch: true, method: 'update' })
    .then((updatedRepModel) => {
      return options.returnJSON ? updatedRepModel.toJSON() : updatedRepModel;
    }).catch(err => err);
};

export const getOrInsertConstituent = (constituentParams, options) => {
  let query = null;
  if (constituentParams.id) {
    query = Constituent.where({ id: constituentParams.id }).fetch();
  } else if (constituentParams.facebook_id) {
    query = Constituent.where({ facebook_id: constituentParams.facebook_id }).fetch();
  } else if (constituentParams.phone) {
    query = Constituent.where({ phone: constituentParams.phone }).fetch();
  } else {
    query = Constituent.forge(constituentParams).save(null, { method: 'insert' });
  }
  return query.then((constituent) => {
    if (!constituent) {
      return Constituent.forge(constituentParams).save().then((newConstituent) => {
        return options.returnJSON ? newConstituent.toJSON() : newConstituent;
      });
    }
    return options.returnJSON ? constituent.toJSON() : constituent;
  });
};
