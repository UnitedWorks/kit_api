import { Router } from 'express';
import { logger } from '../logger';
import { KnowledgeEvent, KnowledgeFacility, KnowledgeService } from './models';
import { getAnswers, getCategories, getContacts, createContact, updateContact, deleteContact,
  getQuestions, makeAnswer, updateAnswer, deleteAnswer, deleteService, createFacility,
  updateFacility, deleteFacility, createService, updateService,
  getQuestionsAsTable, createAnswersFromRows, setCategoryFallback,
  setCategoryRepresentatives, answerQuestion, approveAnswers } from './helpers';
import { requireAuth } from '../services/passport';

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

router.post('/categories/fallback', requireAuth, (req, res, next) => {
  try {
    setCategoryFallback(req.body)
      .then(() => res.status(200).send())
      .catch(error => next(error));
  } catch (e) {
    next(e);
  }
});

router.post('/categories/representatives', requireAuth, (req, res, next) => {
  try {
    setCategoryRepresentatives(req.body)
      .then(() => res.status(200).send())
      .catch(error => next(error));
  } catch (e) {
    next(e);
  }
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
    KnowledgeFacility.where(whereFilters).fetchAll({ withRelated: ['category', 'location', 'services'] })
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
    createFacility(req.body.facility, req.body.organization, req.body.facility.location,
      { returnJSON: true })
      .then(facility => res.status(200).send({ facility }))
      .catch(err => next(err));
  })
  /**
   * Update Facilities
   * @param {Object} facility - Facility object containing updates
   * @param {Number} facility.id - Required: Id of updated object
   * @return {Object}
   */
   .put((req, res, next) => {
     updateFacility(req.body.facility, { returnJSON: true })
       .then(updated => res.status(200).send({ facility: updated }))
       .catch(err => next(err));
   })
   /**
    * Delete facilities
    * @param {Number} id - Id of the facility to be removed
    * @return {Object}
    */
  .delete((req, res, next) => {
    deleteFacility(req.query.facility_id)
      .then(facility => res.status(200).send({ facility }))
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
    KnowledgeEvent.fetchAll({ withRelated: ['category', 'facility', 'location', 'service'] })
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
    KnowledgeService.where(whereFilters).fetchAll({ withRelated: ['category', 'facility', 'location'] })
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
    createService(req.body.service, req.body.organization, req.body.service.location,
      { returnJSON: true })
      .then(saved => res.status(200).send({ service: saved }))
      .catch(err => next(err));
  })
  /**
   * Update service
   * @param {Object} service - Object for service update
   * @return {Object}
   */
  .put((req, res, next) => {
    updateService(req.body.service, { returnJSON: true })
      .then(saved => res.status(200).send({ service: saved }))
      .catch(err => next(err));
  })
  /**
   * Delete Service
   * @param {Number} id - Id of the service to be deleted
   * @return {Object}
   */
  .delete((req, res, next) => {
    deleteService(req.query.service_id)
      .then(service => res.status(200).send({ service }))
      .catch(err => next(err));
  });

/**
 * Contacts Endpoint
 */
router.route('/contacts')
  .get((req, res, next) => {
    try {
      getContacts(req.query, { returnJSON: true })
        .then(contacts => res.status(200).send({ contacts }))
        .catch(error => next(error));
    } catch (e) {
      next(e);
    }
  })
  .post(requireAuth, (req, res, next) => {
    try {
      createContact(req.body, { returnJSON: true })
        .then(contacts => res.status(200).send({ contacts }))
        .catch(error => next(error));
    } catch (e) {
      next(e);
    }
  })
  .put(requireAuth, (req, res, next) => {
    try {
      updateContact(req.body.contact, { returnJSON: true })
        .then(contacts => res.status(200).send({ contacts }))
        .catch(error => next(error));
    } catch (e) {
      next(e);
    }
  })
  .delete(requireAuth, (req, res, next) => {
    try {
      deleteContact({ id: req.query.contact_id }, { returnJSON: true })
        .then(contacts => res.status(200).send({ contacts }))
        .catch(error => next(error));
    } catch (e) {
      next(e);
    }
  });

/**
 * Questions Endpoint
 */
router.post('/question/answer', (req, res, next) => {
  logger.info('Pinged: Answering Question');
  answerQuestion(req.body.organization, req.body.question, req.body.answers)
    .then(data => res.status(200).send(data))
    .catch(error => next(error));
});

router.get('/questions', (req, res, next) => {
  getQuestions(req.query)
    .then(questions => res.status(200).send({ questions }))
    .catch(error => next(error));
});

router.get('/questions/download', requireAuth, (req, res, next) => {
  try {
    getQuestionsAsTable(req.query).then((data) => {
      res.status(200).send({ questions: data });
    }).catch(error => next(error));
  } catch (e) {
    next(e);
  }
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
    getAnswers(params, {}).then(({ answers }) => {
      res.status(200).send({
        answers,
      });
    });
  })
  /**
   * Create Answer
   * @return {Object}
   */
  .post((req, res, next) => {
    try {
      makeAnswer(req.body.organization, req.body.question, req.body.answer, { returnJSON: true })
        .then(answerModel => res.status(200).send({ answer: answerModel }))
        .catch(err => next(err));
    } catch (e) {
      next(e);
    }
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

router.post('/answers/batch', requireAuth, (req, res, next) => {
  try {
    createAnswersFromRows(req.body)
      .then(() => res.status(200).send())
      .catch(error => next(error));
  } catch (e) {
    next(e);
  }
});

router.post('/answers/approve', (req, res, next) => {
  try {
    approveAnswers(req.body.answers)
      .then(() => res.status(200).send())
      .catch(error => next(error));
  } catch (e) {
    next(e);
  }
});

module.exports = router;
