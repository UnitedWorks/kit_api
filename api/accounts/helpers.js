import bcrypt from 'bcrypt-nodejs';
import { knex } from '../orm';
import { Constituent, Organization, Representative } from './models';

export const createOrganization = (organizationModel, options = {}) => {
  return Organization.forge(organizationModel).save(null, { method: 'insert' }).then((model) => {
    return model.refresh({ withRelated: ['address', 'integrations'] }).then((refreshedModel) => {
      return options.returnJSON ? refreshedModel.toJSON() : refreshedModel;
    });
  }).catch(error => error);
};

export const getGovernmentOrganizationAtLocation = (geoData, options = {}) => {
  let subquery = knex('locations')
    .select('id')
    .whereRaw("address->>'state'=?", geoData.address.state);
  if (geoData.address.city) {
    subquery = subquery.whereRaw("address->>'city'=?", geoData.address.city);
  } else if (geoData.address.town) {
    subquery = subquery.whereRaw("address->>'town'=?", geoData.address.town);
  } else if (geoData.address.hamlet) {
    subquery = subquery.whereRaw("address->>'hamlet'=?", geoData.address.hamlet);
  }
  return knex.select('*').from('organizations').whereIn('location_id', subquery)
    .then((res) => {
      if (res.length === 1) {
        const orgJSON = JSON.parse(JSON.stringify(res[0]));
        return Organization.where({ id: orgJSON.id })
          .fetch({ withRelated: ['address', 'integrations', 'messageEntries'] })
          .then(model => (options.returnJSON ? model.toJSON() : model));
      }
      return null;
    })
    .catch(error => error);
};

export const checkForAdminOrganizationAtLocation = (geoData) => {
  let query = knex('organizations').select('*')
    .join('addresss', 'organizations.address_id', 'addresss.id');
  if (geoData.address.city) {
    query = query.whereRaw("address->>'city'=?", geoData.address.city);
  } else if (geoData.address.town) {
    query = query.whereRaw("address->>'town'=?", geoData.address.town);
  } else if (geoData.address.hamlet) {
    query = query.whereRaw("address->>'hamlet'=?", geoData.address.hamlet);
  }
  return query.then((res) => {
    if (res.length > 0) {
      return true;
    }
    return false;
  }).catch(error => error);
};

export const changePassword = (rep) => {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) reject(err);
      bcrypt.hash(rep.password, salt, null, (err, hash) => {
        if (err) reject(err);
        Representative.where({ email: rep.email }).save({ password: hash }, { patch: true, method: 'update' })
          .then(updatedRep => resolve(updatedRep))
          .catch(err => reject(err));
      });
    });
  });
};

export const createRepresentative = (rep, org, options = {}) => {
  let repObj = rep;
  if (org) repObj = Object.assign(rep, { organization_id: org.id });
  return Representative.where({ email: repObj.email }).fetch().then((foundRep) => {
    // If we have a rep without password, update password
    if (foundRep && foundRep.get('password')) {
      throw new Error('User with that email already exists');
    // If no password is in use, update
    } else if (foundRep && !foundRep.get('password')) {
      return changePassword(repObj).then((updatedRep) => {
        return updatedRep.refresh({ withRelated: ['organization', 'organization.address', 'organization.integrations', 'organization.messageEntries'] })
          .then((populatedRep) => {
            const cleanedRep = Object.assign({}, populatedRep.toJSON());
            delete cleanedRep.password;
            return cleanedRep;
          }).catch((error) => { throw new Error(error); });
      }).catch((error) => { throw new Error(error); });
    // Otherwise, create a new rep
    } else {
      return Representative.forge(repObj).save(null, { method: 'insert' }).then((createdRep) => {
        if (!org) return options.returnJSON ? createdRep.toJSON() : createdRep;
        return createdRep.refresh({ withRelated: ['organization', 'organization.address', 'organization.integrations', 'organization.messageEntries'] })
          .then((populatedRep) => {
            const cleanedRep = Object.assign({}, populatedRep.toJSON());
            delete cleanedRep.password;
            return cleanedRep;
          }).catch((error) => { throw new Error(error); });
      }).catch((error) => { throw new Error(error); });
    }
  });
};

export const updateRepresentative = (update, options = { returnJSON: true }) => {
  const filter = {};
  if (update.id) filter.id = update.id;
  if (update.email) filter.email = update.email;
  return Representative.where(filter).save(update, { patch: true, method: 'update' })
    .then((updatedRepModel) => {
      return options.returnJSON ? updatedRepModel.toJSON() : updatedRepModel;
    }).catch(err => err);
};

export const deleteRepresentative = (id) => {
  return knex.select('*').from('knowledge_categorys_representatives').where('representative_id', '=', id).del().then(() => {
    return Representative.where({ id }).destroy({ require: true })
      .then(() => ({ id }))
      .catch(err => err);
  });
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
