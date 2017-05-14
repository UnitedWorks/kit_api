import { Router } from 'express';
import { requireAuth } from '../services/passport';

import { getSurveys, createSurvey, updateSurvey, deleteSurvey, broadcastSurvey, getSurveyAnswers } from './helpers';

const router = new Router();

router.route('/')
  .get(requireAuth, (req, res) => {
    getSurveys(req.query).then((data) => {
      res.status(200).send({
        surveys: data,
      });
    }).catch(error => res.status(400).send({ error }));
  })
  .post(requireAuth, (req, res) => {
    const questions = req.body.survey.questions || req.body.questions || [];
    const survey = req.body.survey;
    const organization = req.body.organization;
    delete survey.questions;
    createSurvey({
      survey,
      questions,
      organization,
    }).then((data) => {
      res.status(200).send({
        survey: data,
      });
    }).catch(error => res.status(400).send({ error }));
  })
  .put(requireAuth, (req, res, next) => {
    try {
      updateSurvey(req.body.survey)
        .then((data) => {
          res.status(200).send({
            survey: data,
          });
        }).catch(error => next(error));
    } catch (e) {
      next(e);
    }
  })
  .delete(requireAuth, (req, res) => {
    deleteSurvey(req.query)
      .then((data) => {
        res.status(200).send({
          survey: data,
        });
      }).catch(error => res.status(400).send({ error }));
  });

router.route('/broadcast')
  .post(requireAuth, (req, res) => {
    broadcastSurvey(req.body.survey)
      .then(() => res.status(200).send())
      .catch(error => res.status(400).send({ error }));
  });

router.route('/download')
  .get(requireAuth, (req, res) => {
    getSurveyAnswers(req.query)
      .then((data) => {
        res.status(200).send({ survey: data });
      }).catch(error => res.status(400).send({ error }));
  });

module.exports = router;
