import bodyParser from 'body-parser';
import { Router } from 'express';
import { logger } from '../logger';
import * as process from './process';
import * as verify from './verify';
import * as helpers from './helpers';
import * as conversationClient from '../constants/interfaces';

const router = new Router();

router.post('/broadcast', (req, res, next) => {
  logger.info('Constituent Broadcast');
  try {
    helpers.makeBroadcast(req.body.broadcast, req.body.organization, { returnJSON: true })
      .then(() => {
        res.status(200).send();
      }).catch((err) => {
        throw new Error(err);
      });
  } catch (e) {
    next(e);
  }
});

router.use('/webhook/facebook', bodyParser.json({
  verify: verify.verifyRequestSignature,
}));

router.route('/webhook/facebook')
  .get((req, res) => {
    logger.info('Facebook Webhook Verification Requested');
    verify.webhookVerificationFacebook(req, res);
  })
  .post((req, res) => {
    logger.info('Facebook Webhook Pinged', req.body);
    process.webhookHitWithMessage(req, res, conversationClient.FACEBOOK);
    res.status(200).send();
  });

router.route('/webhook/twilio')
  .post((req, res) => {
    logger.info('Twilio Webhook Pinged', req.body);
    process.webhookHitWithMessage(req, res, conversationClient.TWILIO);
    res.status(200).send();
  });

module.exports = router;
