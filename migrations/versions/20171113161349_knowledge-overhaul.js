
exports.up = function(knex, Promise) {
  return knex.schema
    // Not going to drop the locations table yet. Waiting till next table
    .renameTable('representatives', 'users')
    .alterTable('knowledge_contacts', (table) => {
      table.integer('user_id').unsigned().references('id').inTable('users');
      table.specificType('languages', 'string[]'); // ISO 639-2
    })
    .alterTable('knowledge_facilitys', (table) => {
      table.specificType('location', 'GEOGRAPHY'); // Point
    })
    .alterTable('organizations', (table) => {
      table.specificType('alternate_names', 'string[]');
    })
    .createTable('assets', (table) => {
      table.increments('id').primary();
      table.string('type'); // Website, App, Web-Form
      table.string('name');
      table.text('description');
      table.string('url');
      table.specificType('languages', 'string[]');
      table.integer('organization_id').unsigned().references('id').inTable('organizations');
    })
    .createTable('phones', (table) => {
      table.increments('id').primary();
      table.string('type'); // 'office', 'fax'
      table.string('extension');
      table.string('number');
      table.specificType('languages', 'string[]');
      table.integer('organization_id').unsigned().references('id').inTable('organizations');
    })
    .createTable('knowledge_services_by', (table) => {
      table.increments('id').primary();
      table.integer('knowledge_service_id').unsigned().references('id').inTable('knowledge_services');
      // Junction Services with:
      table.integer('knowledge_facility_id').unsigned().references('id').inTable('knowledge_facilitys');
      table.integer('knowledge_contact_id').unsigned().references('id').inTable('knowledge_contacts');
      table.integer('organization_id').unsigned().references('id').inTable('organizations');
    })
};

exports.down = function(knex, Promise) {
  return knex.schema
    .renameTable('users', 'representatives')
    .alterTable('knowledge_contacts', (table) => {
      table.dropColumn('user_id');
      table.dropColumn('languages');
    })
    .alterTable('knowledge_facilitys', (table) => {
      table.dropColumn('location');
    })
    .alterTable('organizations', (table) => {
      table.dropColumn('alternate_names');
    })
    .dropTable('assets')
    .dropTable('phones')
    .dropTable('knowledge_services_by')
};
