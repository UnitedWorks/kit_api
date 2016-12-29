require('babel-core/register');
require('./api/env').setup();

const path = require('path');

const dbUser = process.env.DATABASE_USER;
const dbPassword = process.env.DATABASE_USER_PASSWORD;
const dbHost = process.env.DATABASE_HOST;
const dbPort = process.env.DATABASE_PORT;
const dbName = process.env.DATABASE_NAME;
const dbOptions = process.env.DATABASE_PARAMS || '';

const dbConnectionURL = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}${dbOptions}`;

module.exports = {
  client: 'pg',
  connection: dbConnectionURL,
  migrations: {
    directory: path.join(__dirname, '/migrations/versions'),
  },
  seeds: {
    directory: path.join(__dirname, '/seeds'),
  },
};
