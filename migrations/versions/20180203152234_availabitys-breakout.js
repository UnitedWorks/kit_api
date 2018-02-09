
exports.up = function(knex, Promise) {
  return Promise.resolve()
    //  Create Availabilitys Table
    .then(() => {
      return knex.schema
        .createTable('availabilitys', (table) => {
          table.increments('id').primary();
          // Filters
          table.specificType('geo_rules', 'GEOGRAPHY'); // Expecting Multi-polygon
          table.jsonb('constituent_rules'); // Ex) owns_car: true
          table.specificType('schedule_rules', 'jsonb[]'); // Objects with rrule, t_start and t_end
            // Overrides should be in schedules?
            // But then how do we get a history?
            // And it needs a description for the service change
          table.dateTime('over_ride_until');
          table.text('over_ride_reason');
          // Relations
          table.integer('service_id').unsigned().references('id').inTable('services');
          table.integer('place_id').unsigned().references('id').inTable('places');
          // Extras
          table.dateTime('created_at').defaultTo(knex.raw('now()'));
          table.dateTime('updated_at');
        })
        .alterTable('places', (table) => {
          table.renameColumn('availabilitys', 'legacy_availabilitys');
        })
        .alterTable('services', (table) => {
          table.renameColumn('availabilitys', 'legacy_availabilitys');
        });
    })
    // Create Availabilitys for Services
    .then(() => knex.select('*').from('services').then((rows) => {
      const availabilityInsertions = [];
      rows.forEach((record) => {
        record.availabilitys.forEach((ava) => {
          // For each geo, we need to create a new availability rule set
          const polygonStrings = [];
          ava.geo.forEach((geo) => {
            geo.forEach((g) => {
              let polyString = '';
              g.forEach((point, index) => { polyString += `${index !== 0 ? ',' : ''}${point.lat} ${point.lng}`; });
              polyString = `${polyString}, ${g[0].lat} ${g[0].lng}`;
              polygonStrings.push(`((${polyString}))`);
            });
          });
          availabilityInsertions.push({
            schedule_rules: [{
              rrule: ava.rrule,
              t_start: ava.t_start,
              t_end: ava.t_end,
            }],
            geo_rules: knex.raw(`ST_GeomFromText('MULTIPOLYGON(${polygonStrings.join(', ')})',4326)`),
            service_id: record.id,
          });
        });
      });
      return knex.batchInsert('availabilitys', availabilityInsertions).then(r => r);
    }))
    // Create Availabilitys for Places
    .then(() => knex.select('*').from('places').then((rows) => {
      const availabilityInsertions = [];
      rows.forEach((record) => {
        record.availabilitys.forEach((ava) => {
          availabilityInsertions.push({
            schedule_rules: [{
              rrule: ava.rrule,
              t_start: ava.t_start,
              t_end: ava.t_end,
            }],
            place_id: record.id,
          });
        });
      });
      return knex.batchInsert('availabilitys', availabilityInsertions).then(r => r);
    }));
};

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTable('availabilitys')
    .alterTable('places', (table) => {
      table.renameColumn('legacy_availabilitys', 'availabilitys');
    })
    .alterTable('services', (table) => {
      table.renameColumn('legacy_availabilitys', 'availabilitys');
    });
};
