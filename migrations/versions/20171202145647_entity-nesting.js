
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('phones', (table) => {
      table.increments('id').primary();
      table.string('name');
      table.specificType('alternate_names', 'text[]');
      table.text('description');
      table.string('number');
      table.string('extension');
      table.boolean('fax');
      table.specificType('languages', 'text[]');
    })
    .alterTable('medias', (table) => {
      table.specificType('alternate_names', 'text[]');
      table.specificType('languages', 'text[]');
    })
    .alterTable('organizations', (table) => {
      table.renameColumn('website', 'url');
    })
    .alterTable('places', (table) => {
      table.dropColumn('eligibility_information');
    })
    .createTable('organizations_entity_associations', (table) => {
      table.increments('id').primary();
      table.integer('organization_id').unsigned().references('id').inTable('organizations');
      table.integer('service_id').unsigned().references('id').inTable('services');
      table.integer('place_id').unsigned().references('id').inTable('places');
      table.integer('person_id').unsigned().references('id').inTable('persons');
      table.integer('vehicle_id').unsigned().references('id').inTable('vehicles');
      table.integer('phone_id').unsigned().references('id').inTable('phones');
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
      table.dateTime('updated_at');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTable('organizations_entitys')
    .alterTable('places', (table) => {
      table.text('eligibility_information');
    })
    .alterTable('organizations', (table) => {
      table.renameColumn('url', 'website');
    })
    .alterTable('medias', (table) => {
      table.dropColumn('alternate_names');
      table.dropColumn('languages');
    })
    .dropTable('phones');
};
