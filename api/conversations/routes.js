import bodyParser from 'body-parser';
import { Router } from 'express';
import { logger } from '../logger';
import * as process from './process';
import * as verify from './verify';
import * as helpers from './helpers';
import * as conversationClient from '../constants/interfaces';
import { requireAuth } from '../services/passport';

const router = new Router();

router.post('/broadcast', requireAuth, (req, res, next) => {
  logger.info(`Constituent Broadcast - Org: ${req.body.organization.id} - ${req.body.broadcast}`);
  try {
    helpers.broadcastHelper(req.body.broadcast, req.body.organization)
      .then(() => res.status(200).send())
      .catch(err => next(err));
  } catch (e) {
    next(e);
  }
});

router.route('/entry')
  .post(requireAuth, (req, res, next) => {
    logger.info('Creating Entry');
    try {
      helpers.createEntry(req.body.entry, req.body.organization)
        .then(data => res.status(200).send({ data }))
        .catch(err => next(err));
    } catch (e) {
      next(e);
    }
  })
  .put(requireAuth, (req, res, next) => {
    try {
      helpers.updateEntry(req.body.entry)
        .then(data => res.status(200).send({ data }))
        .catch(err => next(err));
    } catch (e) {
      next(e);
    }
  })
  .delete(requireAuth, (req, res, next) => {
    logger.info('Disconnecting Entry');
    try {
      helpers.deleteEntry({ id: req.query.entry_id })
        .then(() => res.status(200).send({ data: { id: req.query.entry_id } }))
        .catch(err => next(err));
    } catch (e) {
      next(e);
    }
  });

router.route('/webhook/http')
  .post((req, res) => {
    logger.info('HTTP Webhook Pinged', req.body);
    process.webhookHitWithMessage(req, res, conversationClient.HTTP);
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
