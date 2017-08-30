
exports.up = function(knex, Promise) {
  return knex.schema
    .dropTable('event_rules');
};

exports.down = function(knex, Promise) {
  return knex.schema
    .createTable('event_rules', (table) => {
      table.increments('id').primary();
      table.datetime('dt_start');
      table.datetime('dt_end');
      table.string('rrule');
      table.integer('knowledge_facility_id')
        .unsigned().references('id').inTable('knowledge_facilitys');
      table.integer('knowledge_service_id')
        .unsigned().references('id').inTable('knowledge_services');
      table.integer('knowledge_event_id')
        .unsigned().references('id').inTable('knowledge_events');
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
      table.dateTime('updated_at');
    });
};
