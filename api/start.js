// Init Babel
require('babel-core/register');

// Setup Logs
require('../tools/setup-logs');

// Setup Environment
require('./env').setup();

// Start Server
require('./server');
