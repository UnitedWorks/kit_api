// Setup
require('babel-core/register');
require('babel-polyfill');
require('../api/env').setup();
const fs = require('fs');

// Read!
const intents = [];
fs.readdirSync(`${__dirname}/data/v2`).forEach((file) => {
  const fileJSON = require(`${__dirname}/data/v2/${file}`);
  fileJSON.forEach(e => intents.push(e));
});

console.log(new Set(intents.filter(i => i.intent).map(i => i.intent)));
