
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('vehicles', (table) => {
      table.increments('id').primary();
      table.string('name');
      table.string('plate');
      table.string('vin');
      table.string('make');
      table.string('model');
      table.date('year');
      table.string('color');
      table.string('fuel'); // gas, diesel, electric
      table.string('transmission'); // automatic, manual
      table.specificType('location', 'GEOGRAPHY');
      table.integer('organization_id').unsigned().references('id').inTable('organizations');

      table.dateTime('created_at').defaultTo(knex.raw('now()'));
      table.dateTime('updated_at');
    })
    .createTable('trips', (table) => {
      table.increments('id').primary();
      table.integer('vehicle_id').unsigned().references('id').inTable('vehicles');
      // Passengers are from the junction table
      table.string('function'); // Could be: snow_removal, fire response, medical response, street sweep, trash pickup, recycling pickup, composting
      table.specificType('path', 'GEOGRAPHY');
      table.dateTime('started_at');
      table.dateTime('ended_at');

      table.dateTime('created_at').defaultTo(knex.raw('now()'));
      table.dateTime('updated_at');
    })
    .createTable('trips_representatives', (table) => {
      table.increments('id').primary();
      table.integer('trip_id').unsigned().references('id').inTable('trips');
      table.integer('representative_id').unsigned().references('id').inTable('representatives');
    })
    .createTable('routes', (table) => {
      table.increments('id').primary();
      table.string('function'); // Could be: snow_removal, fire response, medical response, street sweep, trash pickup, recycling pickup, composting
      table.specificType('path', 'GEOGRAPHY');
      table.integer('organization_id').unsigned().references('id').inTable('organizations');

      table.dateTime('created_at').defaultTo(knex.raw('now()'));
      table.dateTime('updated_at');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTable('trips_representatives')
    .dropTable('vehicles')
    .dropTable('trips')
    .dropTable('routes');
};
