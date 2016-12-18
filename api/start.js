// Init Babel
require('babel-core/register');

// Switch out local or production environment variables
const environment = require('./env.js').passed;

if (environment === 'local') {
  require('dotenv').config({ path: '.env.local' });
} else if (environment === 'production') {
  require('dotenv').config({ path: '.env.production' });
}

// Start Server
require('./server.js');
