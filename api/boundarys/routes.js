import { Router } from 'express';
import { knex } from '../orm';
import { Boundary } from './models';
import { coordinatesToPOSTGIS } from './helpers';

const router = new Router();
router.route('/')
  .get((req, res, next) => {
    const filters = {};
    if (req.query.boundary_id) filters.id = req.query.boundary_id;
    Boundary.where(filters).fetchAll()
      .then((fetched) => {
        if (fetched) {
          res.status(200).send({ boundarys: fetched.toJSON() });
        } else {
          res.status(400).send();
        }
      }).catch(err => next(err));
  })
  .post((req, res, next) => {
    Boundary.forge({ ...req.body.boundary, geo_rules: coordinatesToPOSTGIS(req.body.boundary.geo_rules.coordinates), organization_id: req.body.organization.id }).save(null, { method: 'insert' })
      .then(() => res.status(200).send())
      .catch(err => next(err));
  })
  .put((req, res, next) => {
    Boundary.where({ id: req.body.boundary.id }).save({
      ...req.body.boundary,
      geo_rules: coordinatesToPOSTGIS(req.body.boundary.geo_rules.coordinates),
      updated_at: knex.raw('now()'),
    }, { method: 'update', patch: true })
    .then((updated) => {
      updated.refresh().then((refreshedBoundary) => {
        res.status(200).send({ boundary: refreshedBoundary.toJSON() });
      });
    }).catch(err => next(err));
  })
  .delete((req, res, next) => {
    Boundary.forge({ id: req.query.boundary_id }).destroy()
      .then(() => {
        res.status(200).send({ boundary: { id: req.query.id } });
      }).catch(err => next(err));
  });

module.exports = router;
