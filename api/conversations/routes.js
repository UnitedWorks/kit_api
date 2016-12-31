import { Router } from 'express';
import { logger } from '../logger';
import * as helpers from './helpers';

const router = new Router();

router.get('/webhook', (req, res) => {
  logger.info('Webhook Verification Requested');
  helpers.webhookVerificationFacebook(req, res);
});

router.post('/webhook', (req, res) => {
  logger.info('Webhook Pinged', req.body);
  helpers.webhookHitWithMessage(req, res);
});

module.exports = router;
