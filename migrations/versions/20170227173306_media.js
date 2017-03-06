
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('medias', (table) => {
      table.increments('id').primary();
      table.enum('type', ['image', 'video', 'file']).notNullable();
      table.string('url').notNullable();
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
    })
    .createTable('cases_medias', (table) => {
      table.increments('id').primary();
      table.integer('case_id')
        .unsigned().references('id').inTable('cases');
      table.integer('media_id')
        .unsigned().references('id').inTable('medias');
    })
    .createTable('cases_locations', (table) => {
      table.increments('id').primary();
      table.integer('case_id')
        .unsigned().references('id').inTable('cases');
      table.integer('location_id')
        .unsigned().references('id').inTable('locations');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTable('cases_medias')
    .dropTable('cases_locations')
    .dropTable('medias');
};
