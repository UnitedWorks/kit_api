
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('tasks', (table) => {
      table.increments('id').primary();
      table.string('type'); // Lots of types, could be enum. 'inspection_fire_schedule', 'snap_screening'
      table.enum('status', ['pending', 'completed', 'canceled']).defaultTo('pending');
      table.integer('constituent_id').unsigned().references('id').inTable('constituents');
      table.integer('organization_id').unsigned().references('id').inTable('organizations');
      table.jsonb('params').notNullable();
      table.jsonb('meta').notNullable();
      table.dateTime('completed_at');
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
      table.dateTime('updated_at');
    })
    .createTable('tasks_knowledge_contacts', (table) => {
      table.increments('id').primary();
      table.integer('task_id').unsigned()
        .references('id').inTable('tasks');
      table.integer('knowledge_contact_id').unsigned()
        .references('id').inTable('knowledge_contacts');
    })
    .alterTable('prompt_steps', (table) => {
      table.string('param');
    })
    .raw('ALTER TABLE prompt_actions DROP CONSTRAINT IF EXISTS prompt_actions_type_check')
    .dropTable('prompt_actions')
    .alterTable('prompts', (table) => {
      table.jsonb('concluding_actions');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTable('tasks_knowledge_contacts')
    .dropTable('tasks')
    .alterTable('prompt_steps', (table) => {
      table.dropColumn('param');
    })
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
      table.dropColumn('concluding_actions');
    });
};
