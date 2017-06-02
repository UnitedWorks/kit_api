// To run: NODE_ENV=local node nlu/uploading -filename v2.json
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
const trainingData = require(`./common-entries/${getArg('-filename')}`);
const commonExamples = trainingData.rasa_nlu_data ?
  trainingData.rasa_nlu_data.common_examples : trainingData;

const witFormatedExamples = commonExamples.map(example => ({
  text: example.text,
  entities: [
    ...example.entities,
    {
      entity: 'intent',
      value: example.intent,
    },
  ],
}));

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
