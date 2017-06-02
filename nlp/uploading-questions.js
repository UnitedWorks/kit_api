// To run: NODE_ENV=local node nlu/uploading -filename v2.json
// Setup
require('babel-core/register');
require('../api/env').setup();

function getArg(flag) {
  if (process.argv.indexOf(flag) > -1) {
    return process.argv[process.argv.indexOf(flag) + 1];
  }
  return undefined;
}

const trainingData = require(`./data/${getArg('-filename')}`);
const commonExamples = trainingData.rasa_nlu_data ?
  trainingData.rasa_nlu_data.common_examples : trainingData;

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
