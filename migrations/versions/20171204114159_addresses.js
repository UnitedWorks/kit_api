
exports.up = function(knex, Promise) {
  return Promise.resolve()
    .then(() => {
      return knex.schema
        .renameTable('locations', 'addresss')
        .alterTable('addresss', (table) => {
          table.renameColumn('display_name', 'name');
          table.string('type'); // Postal, Physical
          table.specificType('location', 'GEOGRAPHY'); // Point
          table.dateTime('updated_at');
          table.text('attention');
          table.text('address_1');
          table.text('address_2');
          table.text('address_3');
          table.text('address_4');
          table.text('city');
          table.text('region');
          table.text('state');
          table.text('postal_code');
          table.text('country');
          table.text('country_code');
          table.integer('organization_id').unsigned().references('id').inTable('organizations');
        });
    })
    .then(() => {
      return knex.raw(`UPDATE addresss SET country = address->>country, country_code = address->>country_code WHERE address != NULL`);
    }).then(() => {
      return knex.raw(`UPDATE addresss SET location = ST_GeomFromText('POINT' || '(' || lat || ' ' || lon || ')',4326)`);
    }).then(() => {
      return knex.schema.alterTable('addresss', (table) => {
        table.dropColumn('lat');
        table.dropColumn('lon');
        table.dropColumn('address'); // JSONB
      })
      .createTable('addresss_entity_associations', (table) => {
        table.increments('id').primary();
        table.integer('address_id').unsigned().references('id').inTable('addresss');
        table.integer('place_id').unsigned().references('id').inTable('places');
        table.integer('service_id').unsigned().references('id').inTable('services');
        table.integer('event_id').unsigned().references('id').inTable('events');
        table.integer('organization_id').unsigned().references('id').inTable('organizations');
      })

      .alterTable('places', table => table.dropColumn('location_id'))
      .alterTable('services', table => table.dropColumn('location_id'))
      .alterTable('events', table => table.dropColumn('location_id'))
      .alterTable('organizations', table => table.dropColumn('location_id'))

      .dropTable('integrations_locations');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .renameTable('addresss', 'locations')
    .alterTable('locations', (table) => {
      table.renameColumn('name', 'display_name');
      table.dropColumn('type');
      table.float('lat');
      table.float('lon');
      table.dropColumn('location');
      table.dropColumn('updated_at');

      table.jsonb('address');

      table.dropColumn('attention');
      table.dropColumn('address_1');
      table.dropColumn('address_2');
      table.dropColumn('address_3');
      table.dropColumn('address_4');
      table.dropColumn('city');
      table.dropColumn('region');
      table.dropColumn('state');
      table.dropColumn('postal_code');
      table.dropColumn('country');
      table.dropColumn('country_code');

      table.dropColumn('organization_id');
    })

    .dropTable('addresss_entity_associations')

    .alterTable('places', table => table.integer('location_id').unsigned().references('id').inTable('locations'))
    .alterTable('services', table => table.integer('location_id').unsigned().references('id').inTable('locations'))
    .alterTable('events', table => table.integer('location_id').unsigned().references('id').inTable('locations'))
    .alterTable('organizations', table => table.integer('location_id').unsigned().references('id').inTable('locations'))

    .createTable('integrations_locations', (table) => {
      table.increments('id').primary();
      table.integer('integration_id').unsigned().references('id').inTable('integrations');
      table.integer('location_id').unsigned().references('id').inTable('locations');
    });
};


// Figure out relationship table between places/services at some point
// .createTable('places_services', (table) => {
//   table.increments('id').primary();
//   table.integer('place_id').unsigned().referneces('places.id');
//   table.integer('service_id').unsigned().referneces('services.id');
//   table.dateTime('created_at').defaultTo(knex.raw('now()'));
//   table.dateTime('updated_at');
// })
