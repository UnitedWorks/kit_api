
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('availabilitys', (table) => {
      table.increments('id').primary();
      table.string('rrule');
      table.jsonb('eligibility');
      table.integer('knowledge_service_id').unsigned().references('id').inTable('knowledge_services');
      table.integer('knowledge_facility_id').unsigned().references('id').inTable('knowledge_facilitys');
      // areas => boundarys
      table.integer('location_id').unsigned().references('id').inTable('locations');
    })
    .createTable('boundarys', (table) => {
      table.increments('id').primary();
      table.specificType('area', 'GEOGRAPHY');
      table.integer('availability_id').unsigned().references('id').inTable('availabilitys');
      table.integer('organization_id').unsigned().references('id').inTable('organizations');
      table.integer('knowledge_facility_id').unsigned().references('id').inTable('knowledge_facilitys');
      table.integer('integration_id').unsigned().references('id').inTable('integraitons');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTable('boundarys')
    .dropTable('availabilitys');
};
