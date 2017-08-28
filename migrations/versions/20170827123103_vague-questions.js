
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('knowledge_questions', (table) => {
      table.boolean('vague').defaultTo(false);
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('knowledge_questions', (table) => {
      table.dropColumn('vague');
    });
};
