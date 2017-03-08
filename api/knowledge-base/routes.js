import { Router } from 'express';
import { logger } from '../logger';
import { KnowledgeEvent, KnowledgeFacility, KnowledgeFacilityType, KnowledgeService } from './models';
import { getAnswers, getCategories, getQuestions, makeAnswer, updateAnswer, deleteAnswer } from './helpers';

const router = new Router();

/**
 * Get knowledge base categories
 * @return {Array}
 */
router.get('/categories', (req, res) => {
  logger.info('Pinged: knowledge-base/categories');
  getCategories(req.query)
    .then(categories => res.status(200).send({ categories }))
    .catch(error => res.status(400).send({ error }))
});

/**
 * Get facility types
 * @return {Array}
 */
router.get('/facility-types', (req, res) => {
  logger.info('Pinged: knowledge-base/facility-types');
  KnowledgeFacilityType.fetchAll().then((typesArray) => {
    res.status(200).send({ types: typesArray });
  });
});

/**
 * Facilities Endpoint
 */
router.route('/facilities')
  /**
   * Get Facilities
   * @return {Array}
   */
  .get((req, res) => {
    KnowledgeFacility.fetchAll({ withRelated: ['category', 'events', 'location', 'eventRules', 'services', 'type'] })
      .then((facilityArray) => {
        res.status(200).send({ facilities: facilityArray });
      });
  })
  /**
   * Create Facilities
   * @param {Object} facility - Facility object to be created
   * @return {Object}
   */
  .post((req, res) => {
    KnowledgeFacility.forge(req.body.facility).save(null, { method: 'insert' })
      .then((created) => {
        res.status(200).send({ facility: created });
      }).catch((err) => {
        res.status(200).send(err);
      });
  })
  /**
   * Update Facilities
   * @param {Object} facility - Facility object containing updates
   * @param {Number} facility.id - Required: Id of updated object
   * @return {Object}
   */
   .put((req, res) => {
     KnowledgeFacility.forge(req.body.facility).save(null, { method: 'update' })
       .then((updated) => {
         res.status(200).send({ facility: updated });
       }).catch((err) => {
         res.status(200).send(err);
       });
   })
   /**
    * Delete facilities
    * @param {Number} id - Id of the facility to be removed
    * @return {Object}
    */
  .delete((req, res) => {
    KnowledgeFacility.forge({ id: req.query.id }).destroy()
      .then(() => {
        res.status(200).send();
      }).catch((err) => {
        return res.status(400).send(err);
      });
  });

/**
 * Events Endpoint
 */
router.route('/events')
  /**
   * Get events
   * @return {Array}
   */
  .get((req, res) => {
    KnowledgeEvent.fetchAll({ withRelated: ['category', 'facility', 'location', 'service', 'eventRules'] })
      .then((eventsArray) => {
        res.status(200).send({ events: eventsArray });
      });
  })
  /**
   * Create event
   * @return {Object}
   */
  .post((req, res) => {
    KnowledgeEvent.forge(req.body.event).save(null, { method: 'insert' })
      .then((saved) => {
        res.status(200).send({ event: saved });
      }).catch((err) => {
        res.status(400).send({ error: err });
      });
  })
  /**
   * Update event
   * @return {Object}
   */
  .put((req, res) => {
    KnowledgeEvent.forge(req.body.event).save(null, { method: 'update' })
      .then((updated) => {
        res.status(200).send({ event: updated });
      }).catch((err) => {
        res.status(400).send({ error: err });
      });
  })
  /**
   * Delete event
   * @param {Number} id - Id of the event to be removed
   * @return {Object}
   */
  .delete((req, res) => {
    KnowledgeEvent.forge({ id: req.query.id }).destroy()
      .then(() => {
        res.status(200).send();
      }).catch(() => {
        res.status(400).send();
      });
  });

/**
 * Services Endpoint
 */
router.route('/services')
  /**
   * Get services
   * @return {Array}
   */
  .get((req, res) => {
    KnowledgeService.fetchAll({ withRelated: ['category', 'events', 'facility', 'location', 'eventRules'] })
      .then((serviceArray) => {
        res.status(200).send({ services: serviceArray });
      });
  })
  /**
   * Create service
   * @param {Object} service - Object for service creation
   * @return {Object}
   */
  .post((req, res) => {
    KnowledgeService.forge(req.body.service).save(null, { method: 'insert' })
      .then((saved) => {
        res.status(200).send({ service: saved });
      }).catch((err) => {
        res.status(400).send({ error: err });
      });
  })
  /**
   * Update service
   * @param {Object} service - Object for service update
   * @return {Object}
   */
  .put((req, res) => {
    KnowledgeService.forge(req.body.service).save(null, { method: 'update' })
      .then((saved) => {
        res.status(200).send({ service: saved });
      }).catch((err) => {
        res.status(400).send({ error: err });
      });
  })
  /**
   * Delete Service
   * @param {Number} id - Id of the service to be deleted
   * @return {Object}
   */
  .delete((req, res) => {
    KnowledgeService.forge({ id: req.query.id }).destroy()
      .then(() => {
        res.status(200).send();
      }).catch(() => {
        res.status(400).send();
      });
  });

/**
 * Questions Endpoint
 */
router.get('/questions', (req, res) => {
  getQuestions(req.query)
    .then(questions => res.status(200).send({ questions }))
    .catch(error => res.status(400).send(error));
});

/**
 * Answers Endpoint
 */
router.route('/answers')
  /**
   * Get answers
   * @return {Array}
   */
  .get((req, res) => {
    const params = req.query;
    getAnswers(params, {}).then((payload) => {
      res.status(200).send({
        answers: payload,
      });
    });
  })
  /**
   * Create Answer
   * @return {Object}
   */
  .post((req, res, next) => {
    makeAnswer(req.body.organization, req.body.question, req.body.answer, { returnJSON: true })
      .then(answerModel => res.status(200).send({ answer: answerModel }))
      .catch(err => next(err));
  })
  /**
   * Update Answer
   * @return {Object}
   */
  .put((req, res, next) => {
    updateAnswer(req.body.answer, { returnJSON: true })
      .then(answerModel => res.status(200).send({ answer: answerModel }))
      .catch(err => next(err));
  })
  /**
   * Delete Answer
   * @param {Number} id - Id of the answer to be deleted
   * @return {Object}
   */
  .delete((req, res, next) => {
    deleteAnswer(req.query.answer_id)
      .then(answer => res.status(200).send({ answer }))
      .catch(err => next(err));
  });

module.exports = router;
