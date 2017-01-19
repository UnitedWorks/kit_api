import { Router } from 'express';
import { logger } from '../logger';
import * as process from './process';
import * as verify from './verify';
import * as conversationClient from '../constants/interfaces';

const router = new Router();

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

router.route('/webhook/email')
  .post((req, res) => {
    logger.info('Email Webhook Pinged', req.body);
    res.status(200).send();
  });

module.exports = router;
