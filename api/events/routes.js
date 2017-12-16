import { Router } from 'express';
import { Event as EventModel } from '../events/models';
import { deleteEvent } from './helpers';

const router = new Router();

/**
 * Events Endpoint
 */
router.route('/')
  .get((req, res, next) => {
    EventModel.fetchAll({ withRelated: ['address'] })
      .then(eventsArray => res.status(200).send({ events: eventsArray }))
      .catch(err => next(err));
  })
  .post((req, res, next) => {
    EventModel.forge(req.body.event).save(null, { method: 'insert' })
      .then((saved) => {
        res.status(200).send({ event: saved });
      }).catch(err => next(err));
  })
  .put((req, res, next) => {
    EventModel.forge(req.body.event).save(null, { method: 'update' })
      .then((updated) => {
        res.status(200).send({ event: updated });
      }).catch(err => next(err));
  })
  .delete((req, res, next) => {
    deleteEvent(req.query.event_id)
      .then(() => res.status(200).send())
      .catch(err => next(err));
  });

module.exports = router;
