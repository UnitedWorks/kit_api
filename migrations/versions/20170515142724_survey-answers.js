
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('knowledge_answers', (table) => {
      table.integer('survey_id')
        .unsigned().references('id').inTable('surveys');
      table.dropColumn('expect_response');
    })
    .alterTable('surveys', (table) => {
      table.string('name').nullable().alter();
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('knowledge_answers', (table) => {
      table.dropColumn('survey_id');
      table.boolean('expected_response').defaultTo(false);
    })
    .alterTable('surveys', (table) => {
      table.string('name').notNullable().alter();
    });
};
