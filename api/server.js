import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import fs from 'fs';
import path from 'path';
import * as env from './env';
import * as environments from './constants/environments';
import { logger } from './logger';
import * as clients from './conversations/clients';

const app = express();
const port = process.env.PORT || 5000;

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
  extended: false,
}));

// Process application/json
app.use(bodyParser.json());

// Handle Cross Origin Options
app.use(cors());

app.get('/', (req, res) => {
  res.status(200).send();
});

// API
app.use('/accounts', require('./accounts/routes'));
app.use('/cases', require('./cases/routes'));
app.use('/conversations', require('./conversations/routes'));
app.use('/knowledge-base', require('./knowledge-base/routes'));

app.get('/logs/info', (req, res) => {
  fs.readFile(path.join(__dirname, '..', 'logs/info.log'), 'utf8', (err, data) => {
    res.status(200).send(data);
  });
});

app.get('/logs/error', (req, res) => {
  fs.readFile(path.join(__dirname, '..', 'logs/error.log'), 'utf8', (err, data) => {
    res.status(200).send(data);
  });
});

app.get('/health_check', (req, res) => {
  res.status(200).send("I'm not dead yet!");
});

// Ping/Configure/Setup External Services
if (env.get() === environments.PRODUCTION) {
  clients.configureExternalInterfaces();
}

// Start Server
app.listen(port, () => {
  logger.info(`Server listening at port: ${port}`);
});
