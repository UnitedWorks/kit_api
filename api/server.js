import AWS from 'aws-sdk';
import bodyParser from 'body-parser';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { logger } from './logger';
import * as helpers from './conversations/helpers';
import { Representative, Constituent, Organization } from './accounts/models';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_DEFAULT_REGION,
});

export const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json({
  verify: helpers.verifyRequestSignature,
}));

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
  extended: false,
}));

// Process application/json
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.status(200).send();
});

app.get('/constituents', (req, res) => {
  Constituent.fetchAll().then((cons) => {
    res.status(200).send(cons);
  });
});

app.get('/representatives', (req, res) => {
  Representative.fetchAll().then((reps) => {
    res.status(200).send(reps);
  });
});

app.get('/organizations', (req, res) => {
  Organization.fetchAll().then((orgs) => {
    res.status(200).send(orgs);
  });
});

app.post('/addRep', (req, res) => {
  new Representative(req.body).save()
  .then((saved) => {
    res.status(200).send(saved);
  })
  .catch((err) => {
    res.status(400).send(err);
  });
});

app.get('/conversations/webhook', (req, res) => {
  logger.info('Verification Requested');
  // for Facebook verification
  helpers.webhookVerificationFacebook(req, res);
});

app.post('/conversations/webhook', (req, res) => {
  logger.info('Webhook Pinged: ', req.body);
  // Handle messages
  helpers.webhookHitWithMessage(req, res);
});

app.get('/logs', (req, res) => {
  fs.readFile(path.join(__dirname, '..', 'logs/info.log'), 'utf8', (err, data) => {
    res.status(200).send(data);
  });
});

app.get('/health_check', (req, res) => {
  res.status(200).send("I'm not dead yet!");
});

app.listen(port, () => {
  logger.info(`Server listening at port: ${port}`);
});
