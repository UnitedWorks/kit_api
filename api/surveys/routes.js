import { Router } from 'express';
import { requireAuth } from '../services/passport';

import { getSurveys, createSurvey, deleteSurvey } from './helpers';

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
  .delete(requireAuth, (req, res) => {
    deleteSurvey(req.query)
      .then((data) => {
        res.status(200).send({
          survey: data,
        });
      }).catch(error => res.status(400).send({ error }));
  });


module.exports = router;
