// Setup
require('babel-core/register');
require('babel-polyfill');
require('../api/env').setup();
const knex = require('../api/orm').knex;

const updateOperations = [
  {
    from: 'business_finance.business_assistance_small_business.start',
    to: 'business_finance.business_assistance_small_business',
  },
].map((modification) => {
  // Simply update the label
  if (modification.from && modification.to) {
    return knex('knowledge_questions')
      .where({ label: modification.from })
      .update({ label: modification.to })
      .then(r => r);
  // Delete Associated Data/Answers in addition to Question
  } else if (modification.delete) {
    return knex('knowledge_questions').select()
      .where({ label: modification.from })
      .then(model => Promise.all([
        knex.select().where({ question_id: model.id }).from('knowledge_question_stats').del()
          .then(d => d),
        knex.select().where({ question_id: model.id }).from('knowledge_answers').del()
          .then(d => d),
      ]).then(() => knex('knowledge_questions').where({ id: model.id }).del()));
  }
});

Promise.all(updateOperations).then((results) => {
  console.log(results);
}).catch((error) => {
  console.log(error);
});
