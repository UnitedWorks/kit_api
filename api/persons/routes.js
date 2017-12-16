import { Router } from 'express';
import { getPersons, createPerson, updatePerson, deletePerson } from './helpers';

const router = new Router();

/**
 * Persons Endpoint
 */
router.route('/')
  .get((req, res, next) => {
    try {
      getPersons(req.query, { returnJSON: true })
        .then(persons => res.status(200).send({ persons }))
        .catch(error => next(error));
    } catch (e) {
      next(e);
    }
  })
  .post((req, res, next) => {
    try {
      createPerson(req.body, { returnJSON: true })
        .then(persons => res.status(200).send({ persons }))
        .catch(error => next(error));
    } catch (e) {
      next(e);
    }
  })
  .put((req, res, next) => {
    try {
      updatePerson(req.body.person, { returnJSON: true })
        .then(persons => res.status(200).send({ persons }))
        .catch(error => next(error));
    } catch (e) {
      next(e);
    }
  })
  .delete((req, res, next) => {
    try {
      deletePerson(req.query.person_id, { returnJSON: true })
        .then(() => res.status(200).send())
        .catch(error => next(error));
    } catch (e) {
      next(e);
    }
  });

module.exports = router;
