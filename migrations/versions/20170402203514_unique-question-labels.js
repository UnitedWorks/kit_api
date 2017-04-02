
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('knowledge_questions', (table) => {
      table.unique('label');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('knowledge_questions', (table) => {
      table.dropUnique('label');
    });
};
