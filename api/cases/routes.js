import { Router } from 'express';
import { logger } from '../logger';
import * as process from './helpers';

const router = new Router();

router.route('/webhook/email')
  .post((req, res) => {
    logger.info('Case Email Webhook Pinged');
    process.webhookHitWithEmail(req);
    res.status(200).send();
  });

module.exports = router;
