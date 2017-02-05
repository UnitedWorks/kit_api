
exports.up = function(knex, Promise) {
  return knex.schema
    // Narrative Tables
    .createTable('integrations', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.text('description');
      // Labels are checked when handling state machine events
      table.string('label').notNullable().unique();
    })
    .createTable('narrative_sessions', (table) => {
      table.increments('id').primary();
      table.string('session_id').unique();
      table.integer('constituent_id')
        .unsigned().references('id').inTable('constituents');
      table.integer('organization_id')
        .unsigned().references('id').inTable('organizations');
      table.string('interface_property_id');
      table.string('state_machine_name');
      table.string('state_machine_previous_state');
      table.string('state_machine_current_state');
      // This can be flipped on/off when a rep takes over to prevent entering a state machine
      table.boolean('over_ride').defaultTo(false);
      // Holds info on previous states AND location, organization, sources, user, etc.
      table.jsonb('data_store');
      table.dateTime('updated_at');
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
    })
    // Junction Tables
    .createTable('organizations_integrations', (table) => {
      table.increments('id').primary();
      table.integer('organization_id')
        .unsigned().references('id').inTable('organizations');
      table.integer('integration_id')
        .unsigned().references('id').inTable('integrations');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTable('organizations_integrations')
    .dropTable('narrative_sessions')
    .dropTable('integrations');
};
