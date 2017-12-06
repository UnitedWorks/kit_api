import { Router } from 'express';
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
    Service.where(whereFilters).fetchAll({ withRelated: ['addresses', 'phones'] })
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
      .then(service => res.status(200).send({ service }))
      .catch(err => next(err));
  });

module.exports = router;
