// To run: NODE_ENV=local node nlp/training-wit -filename v2.json
// Setup
require('babel-core/register');
require('babel-polyfill');
require('../api/env').setup();

const axios = require('axios');

// Update the Wit App
const trainingData = require('./data/v2.json');
const commonExamples = trainingData.rasa_nlu_data ?
  trainingData.rasa_nlu_data.common_examples : trainingData;

const witFormatedExamples = commonExamples.map((example) => {
  const entities = [...example.entities];
  if (example.intent) {
    entities.push({
      entity: 'intent',
      value: example.intent,
    });
  }
  return {
    text: example.text,
    entities,
  };
});

axios.request({
  method: 'post',
  url: 'https://api.wit.ai/samples',
  headers: {
    Authorization: `Bearer ${process.env.WIT_ACCESS_TOKEN}`,
  },
  params: {
    v: '20170601',
  },
  data: witFormatedExamples
}).then((res) => {
  console.log(res);
}).catch((err) => {
  console.log(err);
});
