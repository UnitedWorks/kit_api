
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('surveys', (table) => {
      table.increments('id').primary();
      table.string('label');
      table.string('name').notNullable();
      table.text('description');
      table.enum('status', ['open', 'closed']).defaultTo('open');
      table.boolean('template').defaultTo(false);
      table.integer('organization_id')
        .unsigned().references('id').inTable('organizations');
      table.enum('concluding_action', ['create_case']);
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
      table.dateTime('updated_at');
    })
    .createTable('survey_questions', (table) => {
      table.increments('id').primary();
      table.integer('survey_id')
        .unsigned().references('id').inTable('surveys');
      table.integer('position');
      table.text('prompt');
      table.enum('type', ['text', 'email', 'phone', 'number', 'location', 'picture', 'file']).defaultTo('text');
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
      table.dateTime('updated_at');
    })
    .createTable('survey_answers', (table) => {
      table.increments('id').primary();
      table.integer('survey_question_id')
        .unsigned().references('id').inTable('survey_questions');
      table.integer('constituent_id')
        .unsigned().references('id').inTable('constituents');
      table.jsonb('response');
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
      table.dateTime('updated_at');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTable('survey_answers')
    .dropTable('survey_questions')
    .dropTable('surveys');
};
