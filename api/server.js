import * as environment from './env';
import { logger } from './logger';
import * as conversations from './conversations';

const AWS = require('aws-sdk');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const express = require('express');
const fs = require('fs');
const morgan = require('morgan');
const path = require('path');
const request = require('request');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_DEFAULT_REGION
});
const uuid = require('uuid');

export const app = express();
const port = process.env.PORT;

//verify request came from facebook
app.use(bodyParser.json({
  verify: conversations.interfaces.facebook.helpers.verifyRequestSignature
}));

//serve static files in the public directory
app.use(express.static('public'));

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
	extended: false
}));

app.get('/', (req, res) => {
  res.status(200).send();
});

app.get('/conversations/webhook/', (req, res) => {
	logger.info('Verification Requested');
  // for Facebook verification
  conversations.interfaces.facebook.helpers.webhookVerificationFacebook(req, res);
});

app.post('/conversations/webhook/', (req, res) => {
  logger.info('Webhook Pinged');
  // If we see 'page', the request came from Facebook
  if (req.body.object == 'page') {
    conversations.interfaces.facebook.helpers.webhookHitByFacebook(req, res);
  }
  // If we see 'web', the request came from a website
  if (req.body.object == 'web') {
    conversations.interfaces.web.helpers.webhookHitByWeb(req, res);
  }
});

app.get('/logs', (req, res) => {
  fs.readFile(path.join(__dirname, '..', 'logs/info.log'), 'utf8', (err, data) => {
    res.status(200).json(data);
  });
});

app.get('/health_check', (req, res) => {
  res.status(200).send("I'm not dead yet!");
});

app.listen(port, () => {
  logger.info(`Server listening at port: ${port}`);
});
