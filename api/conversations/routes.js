import { app } from '../server';
import { logger } from '../logger';
import { interfaces } from './index';

const express = require('express');
export const routes = express.Router();

routes.get('/webhook/', (req, res) => {
	logger.info('Verification Requested');
  // for Facebook verification
  interfaces.facebook.helpers.webhookVerificationFacebook(req, res);
});

routes.post('/webhook/', (req, res) => {
  logger.info('Webhook Pinged');
  // If we see 'page', the request came from Facebook
  if (req.body.object == 'page') {
    interfaces.facebook.helpers.webhookHitByFacebook(req, res);
  }
  // If we see 'web', the request came from a website
  if (req.body.object == 'web') {
    interfaces.web.helpers.webhookHitByWeb(req, res);
  }
});
