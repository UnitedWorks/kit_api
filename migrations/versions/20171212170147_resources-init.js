
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('resources', (table) => {
      table.increments('id').primary();
      table.text('name');
      table.specificType('alternate_names', 'text[]');
      table.text('description'); // Instructions. Ex) Do this online or mail the form in to X address/person/org?
      table.text('url');
      table.specificType('languages', 'text[]');
      table.integer('organization_id').unsigned().references('id').inTable('organizations');
    })
    .alterTable('medias', (table) => {
      table.dropColumn('description');
      table.dropColumn('alternate_names');
      table.dropColumn('languages');
      table.dropColumn('filename');
      table.renameColumn('original_url', 'from_url');
    })
    .createTable('resources_medias', (table) => {
      table.increments('id').primary();
      table.integer('resource_id').unsigned().references('id').inTable('resources');
      table.integer('media_id').unsigned().references('id').inTable('medias');
    });
};

// Later on, we should probably have resources referencing entities/addresses/phones/etc.
// table.integer('phone_id').unsigned().references('id').inTable('phones');
// table.integer('address_id').unsigned().references('id').inTable('addresss');
// table.specificType('location', 'GEOGRAPHY'); // Can this thing only be done in person at X location?

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTable('resources_medias')
    .dropTable('resources')
    .alterTable('medias', (table) => {
      table.text('description');
      table.specificType('alternate_names', 'text[]');
      table.specificType('languages', 'text[]');
      table.text('filename');
      table.renameColumn('from_url', 'original_url');
    });
};
