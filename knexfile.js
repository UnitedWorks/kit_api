// For ES6 Modules
require('babel-core/register');

var path = require('path');
var env = require('./api/env').get();

var config = {
  local: {
    client: 'pg',
    connection: 'postgresql://kit:community@postgres:5432/kit',
    migrations: {
      directory: path.join(__dirname, '/migrations/versions'),
    },
    seeds: {
      directory: path.join(__dirname, '/seeds/local'),
    },
  },
};

module.exports = config[env];
