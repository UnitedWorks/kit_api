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


// Update the DB
const knex = require('../api/orm').knex;
const questionOperations = [];

knex.select().from('knowledge_categorys').then((catRows) => {
  // Get Knowledge Base Categories
  const categoryHash = {};
  const nonCategories = ['speech', 'interaction', 'settings'];
  catRows.forEach((category) => {
    categoryHash[category.label] = category.id;
  });
  // Put together operations
  commonExamples.filter((value, index, array) => {
    if (array[index - 1] && value.intent !== array[index - 1].intent && !nonCategories.includes(value.intent.split('.')[0])) {
      return value;
    }
    return null;
  }).forEach((example) => {
    questionOperations.push(knex.select().where({ label: example.intent }).from('knowledge_questions').then((row) => {
      // If no row with the intent exists, insert
      if (row.length === 0) {
        const insertProps = {
          label: example.intent,
          question: example.text,
        };
        // Check if there's an intent category to add in
        if (categoryHash[example.intent.split('.')[0]]) {
          insertProps.knowledge_category_id = categoryHash[example.intent.split('.')[0]];
        }
        // Insert
        return knex('knowledge_questions').insert(insertProps).returning('id');
      }
    }));
  });

  Promise.all(questionOperations).then((results) => {
    console.log(results);
  }).catch((error) => {
    console.log(error);
  });
});
