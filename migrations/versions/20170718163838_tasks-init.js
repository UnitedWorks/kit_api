
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('tasks', (table) => {
      table.increments('id').primary();
      table.enum('status', ['pending', 'completed', 'cancelled']).defaultTo('pending');
      table.string('type'); // Lots of types, could be enum. 'inspection_fire_schedule', 'snap_screening'
      table.jsonb('params').notNullable();
      table.dateTime('completed_at');
      table.dateTime('created_at');
      table.dateTime('updated_at').defaultTo(knex.raw('now()'));
      table.integer('constituent_id').unsigned()
        .references('id').inTable('constituents');
      table.integer('organization_id').unsigned()
        .references('id').inTable('organizations');
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
    .alterTable('prompt_actions', (table) => {
      table.string('type').alter();
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTable('tasks_knowledge_contacts')
    .dropTable('tasks')
    .alterTable('prompt_steps', (table) => {
      table.dropColumn('param');
    });
};

// Clean up cases after we get tasks good
  // .dropTable('organizations_cases')
  // .dropTable('cases_locations')
  // .dropTable('cases_medias')
  // .dropTable('case_categorys')
  // .dropTable('cases')
