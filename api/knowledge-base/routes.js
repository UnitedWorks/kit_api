import { Router } from 'express';
import { logger } from '../logger';
import { KnowledgeAnswer, KnowledgeCategory, KnowledgeEvent, KnowledgeFacility, KnowledgeFacilityType, KnowledgeService } from './models';

const router = new Router();

/**
 * Returns all categories
 * @return {Array}
 */
router.get('/categories', (req, res) => {
  logger.info('Pinged: knowledge-base/categories');
  KnowledgeCategory.fetchAll().then((categoriesArray) => {
    res.status(200).send(categoriesArray);
  });
});

/**
 * Returns all facility types
 * @return {Array}
 */
router.get('/facility-types', (req, res) => {
  logger.info('Pinged: knowledge-base/facility-types');
  KnowledgeFacilityType.fetchAll().then((typesArray) => {
    res.status(200).send(typesArray);
  });
});

/**
 * Returns all facilities
 * @return {Array}
 */
router.get('/facilities', (req, res) => {
  logger.info('Pinged: knowledge-base/facilities');
  KnowledgeFacility.fetchAll({ withRelated: ['category', 'type', 'schedule', 'location', 'services'] })
    .then((facilityArray) => {
      res.status(200).send(facilityArray);
    });
});

/**
 * Returns all services
 * @return {Array}
 */
router.get('/events', (req, res) => {
  KnowledgeEvent.fetchAll({ withRelated: ['category', 'facility', 'location', 'service', 'schedule'] })
    .then((eventsArray) => {
      res.status(200).send(eventsArray);
    });
});

/**
 * Returns all events
 * @return {Array}
 */
router.get('/services', (req, res) => {
  KnowledgeService.fetchAll({ withRelated: ['category', 'facility', 'location', 'schedule'] })
    .then((serviceArray) => {
      res.status(200).send(serviceArray);
    });
});

/**
 * Returns all answers
 * @return {Array}
 */
router.get('/answers', (req, res) => {
  KnowledgeAnswer.fetchAll({ withRelated: ['category'] })
    .then((answerArray) => {
      res.status(200).send(answerArray);
    });
});

module.exports = router;
