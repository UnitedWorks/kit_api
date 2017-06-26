import { Router } from 'express';
import { logger } from '../logger';
import { webhookEmail, webhookEmailEvent } from './helpers';

const router = new Router();

router.post('/webhook', (req, res) => {
  logger.info('Case Email Webhook Pinged');
  webhookEmail(req);
  res.status(200).send();
});

router.post('/webhook/event', (req, res) => {
  logger.info('Case Event Webhook Pinged');
  webhookEmailEvent(req);
  res.status(200).send();
});

module.exports = router;
