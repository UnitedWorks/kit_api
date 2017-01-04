import { Router } from 'express';
import { logger } from '../logger';
import { KnowledgeAnswer, KnowledgeCategory, KnowledgeEvent, KnowledgeFacility,
  KnowledgeFacilityType, KnowledgeService } from './models';
import { makeAnswerRelation } from './helpers';

const router = new Router();

/**
 * Get knowledge base categories
 * @return {Array}
 */
router.get('/categories', (req, res) => {
  logger.info('Pinged: knowledge-base/categories');
  KnowledgeCategory.fetchAll().then((categoriesArray) => {
    res.status(200).send({ categories: categoriesArray });
  });
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
    KnowledgeFacility.fetchAll({ withRelated: ['category', 'events', 'location', 'schedule', 'services', 'type'] })
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
    KnowledgeEvent.fetchAll({ withRelated: ['category', 'facility', 'location', 'service', 'schedule'] })
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
    KnowledgeService.fetchAll({ withRelated: ['category', 'events', 'facility', 'location', 'schedule'] })
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
 * Answers Endpoint
 */
router.route('/answers')
  /**
   * Get answers
   * @return {Array}
   */
  .get((req, res) => {
    KnowledgeAnswer.fetchAll({ withRelated: ['category', 'events', 'facilities', 'services'] })
      .then((answerArray) => {
        res.status(200).send({ answers: answerArray });
      });
  })
  /**
   * Create Answer
   * @return {Object}
   */
  .post((req, res) => {
      KnowledgeAnswer.forge(req.body.answer)
        .save(null, {
          method: 'insert',
        }).then((model) => {
          makeAnswerRelation(model, req.body.events, req.body.services, req.body.facilities)
            .then(() => {
              res.status(200).send({ answer: model });
            }).catch((err) => {
              res.status(400).send(err);
            });
        });
  })
  /**
   * Update Answer
   * @return {Object}
   */
  .put((req, res) => {
    KnowledgeAnswer.forge(req.body.answer)
      .save(null, {
        method: 'update'
      }).then((model) => {
        makeAnswerRelation(model, req.body.events, req.body.services, req.body.facilities)
          .then(() => {
            res.status(200).send({ answer: model });
          }).catch((err) => {
            res.status(400).send(err);
          });
      });
  })
  /**
   * Delete Answer
   * @param {Number} id - Id of the answer to be deleted
   * @return {Object}
   */
  .delete((req, res) => {
    KnowledgeAnswer.forge({ id: req.query.id }).destroy()
      .then(() => {
        res.status(200).send();
      }).catch(() => {
        res.status(400).send();
      });
  });

module.exports = router;
