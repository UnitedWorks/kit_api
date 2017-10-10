// Setup
require('babel-core/register');
require('babel-polyfill');
require('../api/env').setup();
const axios = require('axios');
const fs = require('fs');

// Get Args
if (process.argv.length !== 4) throw new Error('Incorrect Number of Arrrrrgs');
// TEXT
const text = process.argv[3];
// INTENT
const intent = process.argv[2];
// Contains . and is valid category
if (intent.indexOf('.') === -1) throw new Error('Intent may be incorrect. Didnt find any "."');
let fitsCategory = false;
fs.readdirSync(`${__dirname}/data/v2`).forEach((file) => {
  if (intent.indexOf(file.replace('.js', '')) >= 0) fitsCategory = true;
  if (intent.indexOf(file.replace('.json', '')) >= 0) fitsCategory = true;
});
if (!fitsCategory) throw new Error('Incompatible Category');

// Train Wit
axios.request({
  method: 'post',
  url: 'https://api.wit.ai/samples',
  headers: { Authorization: `Bearer ${process.env.WIT_ACCESS_TOKEN}` },
  params: { v: '20170601' },
  data: [{ intent, text }],
}).then((res) => {
  console.log(`Wit Response: ${JSON.stringify(res.data)}`);
  // Write/Transform/Update Category Data
  const categoryDataPath = `${__dirname}/data/v2/${intent.slice(0, intent.indexOf('.'))}`;
  let categoryData = require(categoryDataPath);
  categoryData = categoryData.concat({ text, intent }).sort((a, b) => {
    const intentA = (a.intent || '').toUpperCase();
    const intentB = (b.intent || '').toUpperCase();
    if (intentA < intentB) return -1;
    if (intentA > intentB) return 1;
    return 0;
  });
  const finalJSON = JSON.stringify(categoryData);
  fs.writeFile(`${categoryDataPath}.json`, finalJSON, 'utf8', () => { console.log(`File Written: ${categoryDataPath}.json`); });
}).catch((err) => {
  // Otherwise throw error!
  throw new Error(err);
});
