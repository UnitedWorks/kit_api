import { Router } from 'express';
import { knex } from '../orm';
import { Place } from '../places/models';
import { createPlace, updatePlace, deletePlace } from './helpers';

const router = new Router();

/**
 * Places Endpoint
 */
router.route('/')
  .get((req, res, next) => {
    const whereFilters = {};
    if (req.query.organization_id) whereFilters.organization_id = req.query.organization_id;
    Place.where(whereFilters).fetchAll({ withRelated: ['addresses', 'availabilitys', 'phones'] })
      .then(placeArray => res.status(200).send({ places: placeArray }))
      .catch(err => next(err));
  })
  .post((req, res, next) => {
    createPlace(req.body.place, req.body.organization,
      { returnJSON: true })
      .then(place => res.status(200).send({ place }))
      .catch(err => next(err));
  })
   .put((req, res, next) => {
     updatePlace(req.body.place, { returnJSON: true })
       .then(updated => res.status(200).send({ place: updated }))
       .catch(err => next(err));
   })
  .delete((req, res, next) => {
    deletePlace(req.query.place_id)
      .then(() => res.status(200).send())
      .catch(err => next(err));
  });

router.route('/availability/override')
  .post((req, res, next) => {
    knex('availabilitys')
      .where({ place_id: req.body.place_id })
      .whereNotNull('over_ride_reason')
      .del()
      .then(() => {
        knex('availabilitys').insert({
          place_id: req.body.place_id,
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
      .where({ place_id: req.query.place_id })
      .whereNotNull('over_ride_reason')
      .del()
      .then(() => res.status(200).send({ place_id: req.query.place_id }))
      .catch(err => next(err));
  });

module.exports = router;
