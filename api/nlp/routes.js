import { Router } from 'express';
import { requireAuth } from '../utils/passport';
import { getQuestionContext } from './helpers';
import { trainNewStatement } from '../utils/nlp';

const router = new Router();

router.get('/question/find', requireAuth, (req, res, next) => {
  getQuestionContext(req.query.statement, req.query.organization_id)
    .then(context => res.status(200).send({ context }))
    .catch(err => next(err));
});

router.post('/train', requireAuth, (req, res, next) => {
  trainNewStatement(req.body.text, req.body.intent)
    .then(() => res.status(200).send())
    .catch(err => next(err));
});

module.exports = router;
