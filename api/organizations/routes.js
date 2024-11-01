import { Router } from 'express';
import { knex } from '../orm';
import { Organization } from '../accounts/models';
import { createOrganization, updateOrganization, deleteOrganization } from './helpers';

const router = new Router();

/**
 * Organizations/Divisions Endpoint
 */
router.route('/')
  .get((req, res, next) => {
    try {
      if (!req.query || !req.query.organization_id) throw new Error('Need Organization ID');
      Organization.where({ parent_organization_id: req.query.organization_id }).fetchAll({ withRelated: ['addresses', 'places', 'persons', 'services', 'phones'] })
        .then(orgs => res.status(200).send({ organizations: orgs.toJSON() }));
    } catch (e) {
      next(e);
    }
  })
  .post((req, res, next) => {
    try {
      if (!req.body.organization) throw new Error('Must have organization');
      if (!req.body.organization.parent_organization_id) throw new Error('Must belong to an organization');
      createOrganization(req.body.organization)
        .then(organization => res.status(200).send({ organization }))
        .catch(e => next(e));
    } catch (e) {
      next(e);
    }
  })
  .put((req, res, next) => {
    try {
      if (!req.body.organization || !req.body.organization.id) throw new Error('Organization must already have an ID');
      updateOrganization(req.body.organization)
        .then(organization => res.status(200).send({ organization }))
        .catch(e => next(e));
    } catch (e) {
      next(e);
    }
  })
  .delete((req, res, next) => {
    try {
      if (!req.query.organization_id) throw new Error('Must provide ID');
      Organization.where({ id: req.query.organization_id }).fetch().then((org) => {
        if (!org) throw new Error('No Organization Found');
        if (!org.toJSON().parent_organization_id) throw new Error('Cannot Delete Top Level Organizations');
        deleteOrganization(req.query.organization_id)
          .then(() => res.status(200).send())
          .catch(err => next(err));
      })
    } catch (e) {
      next(e);
    }
  });

router.post('/associations', (req, res, next) => {
  try {
    if (!req.body.hasOwnProperty('associate')) throw new Error('No association state defined');
    if (!req.body.hasOwnProperty('organization_id')) throw new Error('No organization state defined');
    if (!req.body.service_id && !req.body.person_id && !req.body.place_id
      && !req.body.vehicle_id && !req.body.phone_id) throw new Error('Missing properties');
    const params = req.body;
    // If associating, do one knex operation
    if (params.associate) {
      delete params.associate;
      knex('organizations_entity_associations').insert(params)
        .then(() => res.status(200).send());
    } else {
      delete params.associate;
    // If diassociating, do another
      knex('organizations_entity_associations').where(params).del()
        .then(() => res.status(200).send());
    }
  } catch (e) {
    next(e);
  }
});

module.exports = router;
