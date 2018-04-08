import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { logger } from './logger';
import { baseErrorHandler } from './utils';
import { scheduledJobs } from './cron';

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
  'http://localhost:3000',
  'http://127.0.0.1:8000',
  'http://127.0.0.1:3000',
  'https://dashboard.kit.community',
  'https://chat.kit.community',
];
const corsOptions = {
  origin: (origin, cb) => {
    const originIsWhitelisted = whitelist.indexOf(origin) !== -1;
    cb(null, originIsWhitelisted);
  },
  credentials: true,
};
app.use(cors(corsOptions));

// API
app.use('/auth', require('./auth/routes'));
app.use('/accounts', require('./accounts/routes'));
app.use('/boundarys', require('./boundarys/routes'));
app.use('/conversations', require('./conversations/routes'));
app.use('/email', require('./email/routes'));
app.use('/feeds', require('./feeds/routes'));
app.use('/integrations', require('./integrations/routes'));
app.use('/knowledge', require('./knowledge-base/routes'));
app.use('/media', require('./media/routes'));
app.use('/persons', require('./persons/routes'));
app.use('/phones', require('./phones/routes'));
app.use('/places', require('./places/routes'));
app.use('/prompts', require('./prompts/routes'));
app.use('/organizations', require('./organizations/routes'));
app.use('/resources', require('./resources/routes'));
app.use('/shouts', require('./shouts/routes'));
app.use('/services', require('./services/routes'));
app.use('/tasks', require('./tasks/routes'));
app.use('/trips', require('./trips/routes'));
app.use('/vehicles', require('./vehicles/routes'));

// Log Viewing
app.get('/logs/info', (req, res, next) => {
  fs.readFile(path.join(__dirname, '..', 'logs/info.log'), 'utf8', (err, data) => {
    if (err) next(err);
    res.status(200).send(data);
  });
});
app.get('/logs/error', (req, res, next) => {
  fs.readFile(path.join(__dirname, '..', 'logs/error.log'), 'utf8', (err, data) => {
    if (err) next(err);
    res.status(200).send(data);
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
  // Start Scheduled Jobs
  try {
    scheduledJobs();
  } catch (e) {
    logger.error(e);
  }
});
