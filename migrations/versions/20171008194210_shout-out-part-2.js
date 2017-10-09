
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('shout_out_triggers', (table) => {
      table.renameColumn('actions', 'config');
    })
    .dropTable('tasks_knowledge_contacts')
    .alterTable('tasks', (table) => {
      table.dropColumn('type');
    })
    // Just clean up
    .alterTable('knowledge_facilitys', (table) => {
      table.dropColumn('knowledge_facility_type_id');
    })
    .dropTable('knowledge_facility_types');
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('shout_out_triggers', (table) => {
      table.renameColumn('config', 'actions');
    })
    .alterTable('tasks', (table) => {
      table.string('type');
    })
    .createTable('tasks_knowledge_contacts', (table) => {
      table.increments('id').primary();
      table.integer('task_id').unsigned()
        .references('id').inTable('tasks');
      table.integer('knowledge_contact_id').unsigned()
        .references('id').inTable('knowledge_contacts');
    })
    .createTable('knowledge_facility_types', (table) => {
      table.increments('id').primary();
      table.string('label');
    })
    .alterTable('knowledge_facilitys', (table) => {
      table.integer('knowledge_facility_type_id').unsigned()
        .references('id').inTable('knowledge_facility_types');
    });
};
