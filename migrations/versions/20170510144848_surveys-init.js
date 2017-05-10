
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('surveys', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.enum('status', ['open', 'closed']).defaultTo('open');
      table.boolean('template').defaultTo(false);
      table.integer('organization_id')
        .references('id').inTable('organizations');
      table.enum('concluding_action', ['create_case']);
    })
    .createTable('survey_questions', (table) => {
      table.increments('id').primary();
      table.integer('survey_id')
        .references('id').inTable('surveys');
      table.integer('position');
      table.text('prompt');
      table.enum('type', ['text', 'email', 'phone', 'number', 'location', 'picture', 'file']).defaultTo('text');
    })
    .createTable('survey_answers', (table) => {
      table.increments('id').primary();
      table.integer('question_id')
        .references('id').inTable('survey_questions');
      table.integer('constituent_id')
        .references('id').inTable('constituents');
      table.jsonb('response');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTable('surveys')
    .dropTable('survey_questions')
    .dropTable('survey_answers');
};
