import { Router } from 'express';
import { logger } from '../logger';
import * as helpers from './helpers';

const router = new Router();

router.get('/', (req, res, next) => {
  try {
    const orgId = req.query.organization_id;
    const options = {
      returnJSON: true,
    };
    options.limit = req.query.limit;
    options.offset = req.query.offset;
    helpers.getCases(orgId, options)
      .then(cases => res.status(200).send({ cases }))
      .catch(error => next(error));
  } catch (e) {
    next(e);
  }
});

router.put('/update_status', (req, res, next) => {
  try {
    const caseId = req.body.case.id;
    const status = req.body.case.status;
    helpers.updateCaseStatus(caseId, status, { returnJSON: true })
      .then(data => res.status(200).send({ case: data }))
      .catch(error => next(error));
  } catch (e) {
    next(e);
  }
});

router.post('/webhook/email', (req, res) => {
  logger.info('Case Email Webhook Pinged');
  helpers.webhookHitWithEmail(req);
  res.status(200).send();
});

router.post('/webhook/event', (req, res) => {
  logger.info('Case Event Webhook Pinged');
  helpers.webhookEmailEvent(req);
  res.status(200).send();
});

module.exports = router;
