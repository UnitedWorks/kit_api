// To run: NODE_ENV=local node nlp/training-wit -filename v2.json
// Setup
require('babel-core/register');
require('../api/env').setup();

const axios = require('axios');
function getArg(flag) {
  if (process.argv.indexOf(flag) > -1) {
    return process.argv[process.argv.indexOf(flag) + 1];
  }
  return undefined;
}


// Update the Wit App
const trainingData = require(`./data/${getArg('-filename')}`);
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
