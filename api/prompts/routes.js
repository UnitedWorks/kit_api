import { Router } from 'express';
import { requireAuth } from '../services/passport';
import { getPrompts, createPrompt, updatePrompt, deletePrompt, getPromptResponsesAsTable } from './helpers';

const router = new Router();

router.route('/')
  .get((req, res) => {
    getPrompts(req.query).then((data) => {
      res.status(200).send({
        prompts: data,
      });
    }).catch(error => res.status(400).send({ error }));
  })
  .post(requireAuth, (req, res) => {
    const steps = req.body.prompt.steps || req.body.steps || [];
    const prompt = req.body.prompt;
    const organization = req.body.organization;
    delete prompt.steps;
    createPrompt({
      prompt,
      steps,
      organization,
    }).then((data) => {
      res.status(200).send({
        prompt: data,
      });
    }).catch(error => res.status(400).send({ error }));
  })
  .put(requireAuth, (req, res, next) => {
    try {
      updatePrompt(req.body.prompt)
        .then((data) => {
          res.status(200).send({
            prompt: data,
          });
        }).catch(error => next(error));
    } catch (e) {
      next(e);
    }
  })
  .delete(requireAuth, (req, res) => {
    deletePrompt(req.query)
      .then((data) => {
        res.status(200).send({
          prompt: data,
        });
      }).catch(error => res.status(400).send({ error }));
  });

router.route('/download')
  .get(requireAuth, (req, res) => {
    getPromptResponsesAsTable(req.query)
      .then((data) => {
        res.status(200).send({ prompt: data });
      }).catch(error => res.status(400).send({ error }));
  });

module.exports = router;
