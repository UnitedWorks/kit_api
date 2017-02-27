import { Router } from 'express';
import { logger } from '../logger';
import * as helpers from './helpers';

const router = new Router();

// TODO(youmustfight): Need to make separate requests model
router.get('/requests', (req, res) => {
  const orgId = req.query.organization_id;
  helpers.getOrganizationCases(orgId, { returnJSON: true })
    .then((cases) => {
      res.status(200).send({ requests: cases });
    }).catch(error => res.status(400).send({ error }));
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
