import { Router } from 'express';
import { bookshelf, knex } from '../orm';
import { Vehicle } from './models';

const router = new Router();
router.route('/')
  .get((req, res, next) => {
    const filters = {};
    if (req.query.vehicle_id) filters.id = req.query.vehicle_id;
    Vehicle.where(filters).fetchAll()
      .then((fetched) => {
        if (fetched) {
          res.status(200).send({ vehicles: fetched.toJSON() });
        } else {
          res.status(400).send();
        }
      }).catch(err => next(err));
  })
  .post((req, res, next) => {
    Vehicle.forge({ ...req.body.vehicle, organization_id: req.body.organization.id }).save(null, { method: 'insert' })
      .then((saved) => {
        res.status(200).send({ vehicle: saved.toJSON() });
      }).catch(err => next(err));
  })
  .put((req, res, next) => {
    const newProps = req.body.vehicle;
    Vehicle.where({ id: req.body.vehicle.id })
      .save({
        ...newProps,
        location: newProps.location && newProps.location.length === 2 ? bookshelf.knex.raw(`ST_SetSRID(ST_Point(${newProps.location[0]},${newProps.location[1]}) , 4326)`) : null,
        updated_at: knex.raw('now()'),
      }, { method: 'update', patch: true })
      .then((updated) => {
        updated.refresh().then((refreshedVehicle) => {
          res.status(200).send({ vehicle: refreshedVehicle.toJSON() });
        });
      }).catch(err => next(err));
  })
  .delete((req, res, next) => {
    Vehicle.forge({ id: req.query.vehicle_id }).destroy()
      .then(() => {
        res.status(200).send({ vehicle: { id: req.query.id } });
      }).catch(err => next(err));
  });

module.exports = router;
