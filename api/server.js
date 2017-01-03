import * as interfaces from './constants/interfaces'
import * as environment from './env';
import { logger } from './logger';
import * as conversations from './conversations/helpers';

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

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json({
  verify: conversations.verifyRequestSignature,
}));

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
  extended: false,
}));

// Process application/json
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.status(200).send();
});

// API
app.use('/accounts', require('./accounts/routes'));
app.use('/conversations', require('./conversations/routes'));
app.use('/knowledge-base', require('./knowledge-base/routes'));

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
