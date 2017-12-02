import { Router } from 'express';
import { Organization } from '../accounts/models';

const router = new Router();

/**
 * Organizations/Divisions Endpoint
 */
router.route('/')
  .get((req, res, next) => {
    try {
      if (!req.query || !req.query.organization_id) throw new Error('Need Organization ID');
      Organization.where({ parent_organization_id: req.query.organization_id }).fetchAll()
        .then(orgs => res.status(200).send({ organizations: orgs.toJSON() }));
    } catch (e) {
      next(e);
    }
  })
  .post((req, res, next) => {
    try {
      if (!req.body.organization) throw new Error('Must have organization');
      if (!req.body.organization.parent_organization_id) throw new Error('Must belong to an organization');
      Organization.forge(req.body.organization).save(null, { method: 'insert' })
        .then(orgs => res.status(200).send({ organizations: orgs.toJSON() }));
    } catch (e) {
      next(e);
    }
  })
  .put((req, res, next) => {
    try {
      if (!req.body.organization || !req.body.organization.id) throw new Error('Organization must already have an ID');
      Organization.where({ id: req.body.organization.id }).save(req.body.organization, { patch: true, method: 'update' })
        .then(orgs => res.status(200).send({ organizations: orgs.toJSON() }));
    } catch (e) {
      next(e);
    }
  })
  .delete((req, res, next) => {
    try {
      if (!req.query.organization_id) throw new Error('Must provide ID');
      Organization.forge({ id: req.query.organization_id }).destroy()
        .then(() => res.status(200).send({ organization: { id: req.query.organization_id } }));
    } catch (e) {
      next(e);
    }
  });

module.exports = router;
