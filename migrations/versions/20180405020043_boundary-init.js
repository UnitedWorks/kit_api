
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('boundarys', (table) => {
      table.increments('id').primary();
      table.string('name');
      table.specificType('geo_rules', 'GEOGRAPHY'); // Expecting polygon/multi-polygon
      table.specificType('functions', 'text[]'); // Political?
      table.integer('organization_id').unsigned().references('id').inTable('organizations');
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
      table.dateTime('updated_at');
    })
    .createTable('boundarys_entity_associations', (table) => {
      table.increments().primary();
      table.integer('boundary_id').unsigned().references('boundarys.id');
      table.integer('person_id').unsigned().references('persons.id');
      table.integer('organization_id').unsigned().references('organizations.id');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTable('boundarys_entity_associations')
    .dropTable('boundarys');
};
