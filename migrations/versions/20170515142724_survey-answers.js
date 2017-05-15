
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('knowledge_answers', (table) => {
      table.integer('survey_id')
        .unsigned().references('id').inTable('surveys');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('knowledge_answers', (table) => {
      table.dropColumn('survey_id');
    });
};
