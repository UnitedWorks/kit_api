import { Router } from 'express';
import { logger } from '../logger';
import { Organization } from '../accounts/models';
import { Event, Place, Service } from './models';
import { getAnswers, getCategories, getPersons, createPerson, updatePerson, deletePerson,
  getQuestions, makeAnswer, updateAnswer, deleteAnswer, deleteService, createPlace,
  updatePlace, deletePlace, createService, updateService,
  getQuestionsAsTable, createAnswersFromRows, setCategoryFallback,
  setCategoryRepresentatives, answerQuestion, approveAnswers } from './helpers';
import { requireAuth } from '../services/passport';

const router = new Router();

/**
 * Knowledge Base Categories
 */
router.get('/categories', (req, res) => {
  logger.info('Pinged: knowledge-base/categories');
  getCategories(req.query)
    .then(categories => res.status(200).send({ categories }))
    .catch(error => res.status(400).send({ error }));
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
 * Organizations/Divisions Endpoint
 */
router.route('/organizations')
  .get((req, res, next) => {
    try {
      if (!req.query || !req.query.organization_id) throw new Error('Need Organization ID');
      Organization.where({ parent_organization_id: req.query.organization_id }).fetchAll()
        .then(orgs => res.status(200).send({ organizations: orgs.toJSON() }));
    } catch (e) {
      next(e);
    }
  })
  .post((req, res, next) => {
    try {
      if (!req.body.organization) throw new Error('Must have organization');
      if (!req.body.organization.parent_organization_id) throw new Error('Must belong to an organization');
      Organization.forge(req.body.organization).save(null, { method: 'insert' })
        .then(orgs => res.status(200).send({ organizations: orgs.toJSON() }));
    } catch (e) {
      next(e);
    }
  })
  .put((req, res, next) => {
    try {
      if (!req.body.organization || !req.body.organization.id) throw new Error('Organization must already have an ID');
      Organization.where({ id: req.body.organization.id }).save(req.body.organization, { patch: true, method: 'update' })
        .then(orgs => res.status(200).send({ organizations: orgs.toJSON() }));
    } catch (e) {
      next(e);
    }
  })
  .delete((req, res, next) => {
    try {
      if (!req.query.organization_id) throw new Error('Must provide ID');
      Organization.forge({ id: req.query.organization_id }).destroy()
        .then(() => res.status(200).send({ organization: { id: req.query.organization_id } }));
    } catch (e) {
      next(e);
    }
  });

/**
 * Facilities Endpoint
 */
router.route('/places')
  .get((req, res) => {
    const whereFilters = {};
    if (req.query.organization_id) whereFilters.organization_id = req.query.organization_id;
    Place.where(whereFilters).fetchAll({ withRelated: ['category', 'location'] })
      .then((placeArray) => {
        res.status(200).send({ places: placeArray });
      });
  })
  .post((req, res, next) => {
    createPlace(req.body.place, req.body.organization, req.body.place.location,
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
      .then(place => res.status(200).send({ place }))
      .catch(err => next(err));
  });

/**
 * Events Endpoint
 */
router.route('/events')
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

/**
 * Services Endpoint
 */
router.route('/services')
  .get((req, res, next) => {
    const whereFilters = {};
    if (req.query.organization_id) whereFilters.organization_id = req.query.organization_id;
    Service.where(whereFilters).fetchAll({ withRelated: ['category', 'location'] })
      .then(serviceArray => res.status(200).send({ services: serviceArray }))
      .catch(err => next(err));
  })
  .post((req, res, next) => {
    createService(req.body.service, req.body.organization, req.body.service.location,
      { returnJSON: true })
      .then(saved => res.status(200).send({ service: saved }))
      .catch(err => next(err));
  })
  .put((req, res, next) => {
    updateService(req.body.service, { returnJSON: true })
      .then(saved => res.status(200).send({ service: saved }))
      .catch(err => next(err));
  })
  .delete((req, res, next) => {
    deleteService(req.query.service_id)
      .then(service => res.status(200).send({ service }))
      .catch(err => next(err));
  });

/**
 * Persons Endpoint
 */
router.route('/persons')
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
      deletePerson({ id: req.query.person_id }, { returnJSON: true })
        .then(persons => res.status(200).send({ persons }))
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

router.get('/questions/download', (req, res, next) => {
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
  .get((req, res) => {
    const params = req.query;
    getAnswers(params, {}).then(({ answers }) => {
      res.status(200).send({
        answers,
      });
    });
  })
  .post((req, res, next) => {
    try {
      makeAnswer(req.body.organization, req.body.question, req.body.answer, { returnJSON: true })
        .then(answerModel => res.status(200).send({ answer: answerModel }))
        .catch(err => next(err));
    } catch (e) {
      next(e);
    }
  })
  .put((req, res, next) => {
    updateAnswer(req.body.answer, { returnJSON: true })
      .then(answerModel => res.status(200).send({ answer: answerModel }))
      .catch(err => next(err));
  })
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
