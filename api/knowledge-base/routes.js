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
    const whereFilters = {};
    if (req.query.organization_id) whereFilters.organization_id = req.query.organization_id;
    KnowledgeFacility.where(whereFilters).fetchAll({ withRelated: ['category', 'events', 'location', 'eventRules', 'services', 'type'] })
      .then((facilityArray) => {
        res.status(200).send({ facilities: facilityArray });
      });
  })
  /**
   * Create Facilities
   * @param {Object} facility - Facility object to be created
   * @param {Object} organization - Organization to associate facility with
   * @return {Object}
   */
  .post((req, res, next) => {
    const compiledModel = {
      ...req.body.facility,
      organization_id: req.body.organization.id,
    };
    KnowledgeFacility.forge(compiledModel).save(null, { method: 'insert' })
      .then(created => res.status(200).send({ facility: created }))
      .catch(err => next(err));
  })
  /**
   * Update Facilities
   * @param {Object} facility - Facility object containing updates
   * @param {Number} facility.id - Required: Id of updated object
   * @return {Object}
   */
   .put((req, res, next) => {
     const compiledModel = {
       id: req.body.facility.id,
       name: req.body.facility.name,
       description: req.body.facility.description,
     };
     KnowledgeFacility.forge(compiledModel).save(null, { method: 'update' })
       .then(updated => res.status(200).send({ facility: updated }))
       .catch(err => next(err));
   })
   /**
    * Delete facilities
    * @param {Number} id - Id of the facility to be removed
    * @return {Object}
    */
  .delete((req, res, next) => {
    KnowledgeFacility.forge({ id: req.query.facility_id }).destroy()
      .then(() => res.status(200).send({ facility: { id: req.query.facility_id } }))
      .catch(err => next(err));
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
  .get((req, res, next) => {
    const whereFilters = {};
    if (req.query.organization_id) whereFilters.organization_id = req.query.organization_id;
    KnowledgeService.where(whereFilters).fetchAll({ withRelated: ['category', 'events', 'facility', 'location', 'eventRules'] })
      .then(serviceArray => res.status(200).send({ services: serviceArray }))
      .catch(err => next(err));
  })
  /**
   * Create service
   * @param {Object} service - Object for service creation
   * @param {Object} organization - Organization to associate service with
   * @return {Object}
   */
  .post((req, res, next) => {
    const serviceModel = {
      ...req.body.service,
      organization_id: req.body.organization.id,
    };
    KnowledgeService.forge(serviceModel).save(null, { method: 'insert' })
      .then(saved => res.status(200).send({ service: saved }))
      .catch(err => next(err));
  })
  /**
   * Update service
   * @param {Object} service - Object for service update
   * @return {Object}
   */
  .put((req, res, next) => {
    const serviceModel = {
      id: req.body.service.id,
      name: req.body.service.name,
      description: req.body.service.description,
    };
    KnowledgeService.forge(serviceModel).save(null, { method: 'update' })
      .then(saved => res.status(200).send({ service: saved }))
      .catch(err => next(err));
  })
  /**
   * Delete Service
   * @param {Number} id - Id of the service to be deleted
   * @return {Object}
   */
  .delete((req, res, next) => {
    KnowledgeService.forge({ id: req.query.service_id }).destroy()
      .then(() => res.status(200).send({ service: { id: req.query.service_id } }))
      .catch(err => next(err));
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
