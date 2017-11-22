
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
      table.string('function'); // snow removal, fire response, etc...
      table.specificType('path', 'GEOGRAPHY');
      table.dateTime('started_at');
      table.dateTime('ended_at');
      // Passengers are from the junction table to be made later

      table.dateTime('created_at').defaultTo(knex.raw('now()'));
      table.dateTime('updated_at');
    })
    .createTable('routes', (table) => {
      table.increments('id').primary();
      table.string('function'); // snow removal, fire response, etc...
      table.specificType('path', 'GEOGRAPHY');
      table.integer('organization_id').unsigned().references('id').inTable('organizations');

      table.dateTime('created_at').defaultTo(knex.raw('now()'));
      table.dateTime('updated_at');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTable('trips')
    .dropTable('routes')
    .dropTable('vehicles');
};
