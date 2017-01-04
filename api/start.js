// Init Babel
require('babel-core/register');

// Setup Logs
require('../tools/logs');

// Setup Environment
require('./env').setup();

// Start Server
require('./server');
