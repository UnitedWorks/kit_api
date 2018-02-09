import { Router } from 'express';
import { knex } from '../orm';
import { Service } from '../services/models';
import { deleteService, createService, updateService } from './helpers';

const router = new Router();

/**
 * Services Endpoint
 */
router.route('/')
  .get((req, res, next) => {
    const whereFilters = {};
    if (req.query.organization_id) whereFilters.organization_id = req.query.organization_id;
    Service.where(whereFilters).fetchAll({ withRelated: ['addresses', 'availabilitys', 'phones'] })
      .then(serviceArray => res.status(200).send({ services: serviceArray }))
      .catch(err => next(err));
  })
  .post((req, res, next) => {
    createService(req.body.service, req.body.organization, req.body.service.location,
      { returnJSON: true })
      .then(saved => res.status(200).send({ service: saved }))
      .catch(err => next(err));
  })
  .put((req, res, next) => {
    updateService(req.body.service, { returnJSON: true })
      .then(saved => res.status(200).send({ service: saved }))
      .catch(err => next(err));
  })
  .delete((req, res, next) => {
    deleteService(req.query.service_id)
      .then(() => res.status(200).send())
      .catch(err => next(err));
  });

router.route('/availability/override')
  .post((req, res, next) => {
    knex('availabilitys')
      .where({ service_id: req.body.service_id })
      .whereNotNull('over_ride_reason')
      .del()
      .then(() => {
        knex('availabilitys').insert({
          service_id: req.body.service_id,
          over_ride_reason: req.body.over_ride_reason,
          over_ride_until: req.body.over_ride_until,
        })
        .then(a => res.status(200).send({ availability_id: a.id }))
        .catch(err => next(err));
      })
      .catch(err => next(err));
  })
  .delete((req, res, next) => {
    knex('availabilitys')
      .where({ service_id: req.query.service_id })
      .whereNotNull('over_ride_reason')
      .del()
      .then(() => res.status(200).send({ service_id: req.query.service_id }))
      .catch(err => next(err));
  });

module.exports = router;
