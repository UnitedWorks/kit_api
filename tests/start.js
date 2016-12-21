// Init Babel
require('babel-core/register');

// Setup Environment
require('../api/env').setup();

// Start Tests
require('./tests.js');
