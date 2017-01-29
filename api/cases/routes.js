import { Router } from 'express';
import { logger } from '../logger';
import * as process from './helpers';

const router = new Router();

router.post('/webhook/email', (req, res) => {
  logger.info('Case Email Webhook Pinged');
  process.webhookHitWithEmail(req);
  res.status(200).send();
});

router.post('/webhook/event', (req, res) => {
  logger.info('Case Event Webhook Pinged');
  process.webhookEmailEvent(req);
  res.status(200).send();
});

module.exports = router;
