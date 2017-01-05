import { Router } from 'express';
import { logger } from '../logger';
import * from './process';
import * from './verify';

const router = new Router();

router.route('/webhook')
  .get((req, res) => {
    logger.info('Webhook Verification Requested');
    webhookVerificationFacebook(req, res);
  })
  .post((req, res) => {
    logger.info('Webhook Pinged', req.body);
    webhookHitWithMessage(req, res);
  });

module.exports = router;
