
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('knowledge_question_stats', (table) => {
      table.integer('question_id')
        .references('id').inTable('knowledge_questions');
      table.integer('organization_id')
        .references('id').inTable('organizations');
      table.integer('times_asked');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTable('knowledge_question_stats');
};
