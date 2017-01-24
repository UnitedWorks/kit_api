
exports.up = function (knex, Promise) {
  return knex.schema
    // Primitive Documents
    .createTable('locations', (table) => {
      table.increments('id').primary();
      table.float('latitude');
      table.float('longitude');
      table.string('formatted_address');
      table.string('street_number');
      table.string('street_name');
      table.string('city');
      table.string('zipcode');
      table.string('country');
      table.string('country_code');
      table.jsonb('administrative_levels');
      table.jsonb('extra');
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
    })
    .createTable('schedules', (table) => {
      table.increments('id').primary();
    })
    // Account Documents
    .createTable('organizations', (table) => {
      table.increments('id').primary();
      table.string('name');
      table.string('abbreviation');
      table.string('email');
      table.string('phone');
      table.string('website');
      table.enum('category', ['public', 'ngo', 'private']);
      table.enum('type', ['admin', 'division']);
      table.boolean('activated').defaultTo(false);
      table.integer('location_id')
        .unsigned().references('id').inTable('locations');
      table.integer('parent_organization_id')
        .unsigned().references('id').inTable('organizations');
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
    })
    .createTable('constituents', (table) => {
      table.increments('id').primary();
      table.string('email');
      table.string('phone');
      table.string('facebook_id');
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
    })
    .createTable('representatives', (table) => {
      table.increments('id').primary();
      table.string('name');
      table.string('title');
      table.string('email').notNullable().unique();
      table.string('phone');
      table.string('password');
      table.string('salt');
      table.boolean('email_confirmed').defaultTo(false);
      table.integer('organization_id')
        .unsigned().references('id').inTable('organizations');
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
    })
    .createTable('organizations_constituents', (table) => {
      table.increments('id').primary();
      table.integer('organization_id')
        .unsigned().references('id').inTable('organizations');
      table.integer('constituent_id')
        .unsigned().references('id').inTable('constituents');
      table.string('type');
    });
};

exports.down = (knex, Promise) => {
  return knex.schema
    .dropTable('organizations_constituents')
    .dropTable('constituents')
    .dropTable('representatives')
    .dropTable('organizations')
    .dropTable('schedules')
    .dropTable('locations');
};
