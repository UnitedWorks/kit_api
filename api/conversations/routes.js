import { Router } from 'express';
import { logger } from '../logger';
import * as process from './process';
import * as verify from './verify';

const router = new Router();

router.route('/webhook')
  .get((req, res) => {
    logger.info('Webhook Verification Requested');
    verify.webhookVerificationFacebook(req, res);
  })
  .post((req, res) => {
    logger.info('Webhook Pinged', req.body);
    process.webhookHitWithMessage(req, res);
    // Response is expected by whoever hit the webhook
    res.status(200).send();
  });

module.exports = router;
