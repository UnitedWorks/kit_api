import { Router } from 'express';
import { Place } from '../places/models';
import { createPlace, updatePlace, deletePlace } from './helpers';

const router = new Router();

/**
 * Places Endpoint
 */
router.route('/')
  .get((req, res) => {
    const whereFilters = {};
    if (req.query.organization_id) whereFilters.organization_id = req.query.organization_id;
    Place.where(whereFilters).fetchAll({ withRelated: ['addresses', 'availabilitys', 'phones'] })
      .then((placeArray) => {
        res.status(200).send({ places: placeArray });
      });
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

module.exports = router;
