import { Router } from 'express';
import { logger } from '../logger';
import { getAnswers, getCategories, getQuestions, makeAnswer, updateAnswer, deleteAnswer,
  getQuestionsAsTable, createAnswersFromRows, setCategoryFallback,
  answerQuestion, approveAnswers } from './helpers';
import { requireAuth } from '../utils/passport';

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
