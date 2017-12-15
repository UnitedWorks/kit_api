import { Router } from 'express';
import { knex } from '../orm';
import { Resource } from './models';
import { quickSetMediaResources } from './helpers';

const router = new Router();
router.route('/')
  .get((req, res, next) => {
    const filters = {};
    if (req.query.resource_id) filters.id = req.query.resource_id;
    if (req.query.organization_id) filters.organization_id = req.query.organization_id;
    Resource.where(filters).fetchAll({ withRelated: ['media'] })
      .then((fetched) => {
        res.status(200).send({ resources: fetched ? fetched.toJSON() : [] });
      }).catch(err => next(err));
  })
  .post((req, res, next) => {
    const cleanedResource = Object.assign({}, req.body.resource);
    delete cleanedResource.media;
    Resource.forge({ ...cleanedResource, organization_id: req.body.organization.id }).save(null, { method: 'insert' })
      .then((saved) => {
        if (req.body.resource.media) quickSetMediaResources(saved.id, req.body.resource.media);
        res.status(200).send({ resource: saved.toJSON() });
      }).catch(err => next(err));
  })
  .put((req, res, next) => {
    const cleanedResource = Object.assign({}, req.body.resource);
    delete cleanedResource.media;
    Resource.where({ id: cleanedResource.id }).save({
      ...cleanedResource,
      updated_at: knex.raw('now()'),
    }, { method: 'update', patch: true })
    .then((updated) => {
      if (req.body.resource.media) quickSetMediaResources(updated.id, req.body.resource.media);
      updated.refresh().then((refreshedResource) => {
        res.status(200).send({ resource: refreshedResource.toJSON() });
      });
    }).catch(err => next(err));
  })
  .delete((req, res, next) => {
    Resource.forge({ id: req.query.resource_id }).destroy()
      .then(() => {
        res.status(200).send({ resource: { id: req.query.id } });
      }).catch(err => next(err));
  });

module.exports = router;
