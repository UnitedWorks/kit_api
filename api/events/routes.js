import { Router } from 'express';
import { Event } from '../events/models';

const router = new Router();

/**
 * Events Endpoint
 */
router.route('/')
  .get((req, res) => {
    Event.fetchAll()
      .then((eventsArray) => {
        res.status(200).send({ events: eventsArray });
      });
  })
  .post((req, res) => {
    Event.forge(req.body.event).save(null, { method: 'insert' })
      .then((saved) => {
        res.status(200).send({ event: saved });
      }).catch((err) => {
        res.status(400).send({ error: err });
      });
  })
  .put((req, res) => {
    Event.forge(req.body.event).save(null, { method: 'update' })
      .then((updated) => {
        res.status(200).send({ event: updated });
      }).catch((err) => {
        res.status(400).send({ error: err });
      });
  })
  .delete((req, res) => {
    Event.forge({ id: req.query.id }).destroy()
      .then(() => {
        res.status(200).send();
      }).catch(() => {
        res.status(400).send();
      });
  });

module.exports = router;
