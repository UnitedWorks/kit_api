// Setup
require('babel-core/register');
require('babel-polyfill');
require('../api/env').setup();
const knex = require('../api/orm').knex;

const updateOperations = [
  // { delete: 'transportation_streets_sidewalks.plowing' },
  { from: 'transportation_streets_sidewalks.snow.shoveling', to: 'transportation_streets_sidewalks.snow.assistance' },
  { from: 'property_buildings_homes.district_zoning.search', to: 'property_buildings_homes.zoning.map' },
].map((modification) => {
  // Simply update the label
  if (modification.from && modification.to) {
    return knex('knowledge_questions')
      .where({ label: modification.from })
      .update({ label: modification.to, updated_at: knex.raw('now()') })
      .then(r => r);
  // Delete Associated Data/Answers in addition to Question
  } else if (modification.delete) {
    return knex('knowledge_questions').select()
      .where({ label: modification.delete })
      .then((model) => {
        if (model && model[0] && model[0].id) {
          const modelId = model[0].id;
          knex.select('*').where({ question_id: modelId }).from('knowledge_question_stats').del()
            .then(d => d);
          return knex.select('*').where({ question_id: modelId }).from('knowledge_answers').del()
            .then(() => {
              return knex.select()
                .where({ label: modification.delete })
                .from('knowledge_questions')
                .del()
                .then(d => d);
            });
        }
      });
  }
});

Promise.all(updateOperations).then((results) => {
  console.log(results);
}).catch((error) => {
  console.log(error);
});
