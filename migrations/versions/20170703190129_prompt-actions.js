
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('prompt_actions', (table) => {
      table.increments('id').primary();
      table.integer('prompt_id')
        .unsigned().references('id').inTable('prompts');
      table.enum('type', ['create_case', 'email_responses']).notNullable();
      table.jsonb('config');
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
      table.dateTime('updated_at');
    })
    .alterTable('prompts', (table) => {
      table.dropColumn('concluding_action');
      table.dropColumn('template');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTable('prompt_actions')
    .alterTable('prompts', (table) => {
      table.enum('concluding_action', ['create_case']);
      table.boolean('template').defaultTo(false);
    });
};
