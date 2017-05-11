import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import fs from 'fs';
import path from 'path';
import * as env from './env';
import * as environments from './constants/environments';
import { logger } from './logger';
import * as clients from './conversations/clients';
import { baseErrorHandler } from './utils';

const app = express();
const port = process.env.PORT || 5000;

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
  extended: false,
}));

// Process application/json
app.use(bodyParser.json({
  extended: true,
}));

// Handle Cross Origin Options
const whitelist = [
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'https://dashboard.kit.community',
];
const corsOptions = {
  origin: (origin, cb) => {
    const originIsWhitelisted = whitelist.indexOf(origin) !== -1;
    cb(null, originIsWhitelisted);
  },
  credentials: true,
};
app.use(cors(corsOptions));

app.get('/', (req, res) => {
  res.status(200).send();
});

// API
app.use('/auth', require('./auth/routes'));
app.use('/accounts', require('./accounts/routes'));
app.use('/cases', require('./cases/routes'));
app.use('/conversations', require('./conversations/routes'));
app.use('/integrations', require('./integrations/routes'));
app.use('/knowledge', require('./knowledge-base/routes'));
app.use('/media', require('./media/routes'));
app.use('/surveys', require('./surveys/routes'));

// Log Viewing
app.get('/logs/info', (req, res) => {
  fs.readFile(path.join(__dirname, '..', 'logs/info.log'), 'utf8', (err, data) => {
    res.status(200).json(data);
  });
});
app.get('/logs/error', (req, res) => {
  fs.readFile(path.join(__dirname, '..', 'logs/error.log'), 'utf8', (err, data) => {
    res.status(200).json(data);
  });
});

// Health check route for AWS Cluster checks
app.get('/health_check', (req, res) => {
  res.status(200).send("I'm not dead yet!");
});

// Error Handling
app.use(baseErrorHandler);

// Start Server
app.listen(port, () => {
  logger.info(`Server listening at port: ${port}`);
});
