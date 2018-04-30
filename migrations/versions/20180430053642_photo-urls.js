
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('persons', (table) => {
      table.string('photo_url');
      table.dropColumn('photo_id');
    })
    .alterTable('places', (table) => {
      table.string('photo_url');
    })
    .alterTable('services', (table) => {
      table.string('photo_url');
    })
    .alterTable('organizations', (table) => {
      table.string('photo_url');
    })
    .alterTable('resources', (table) => {
      table.string('photo_url');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('persons', (table) => {
      table.dropColumn('photo_url');
      table.integer('photo_id').unsigned().references('medias.id');
    })
    .alterTable('places', (table) => {
      table.dropColumn('photo_url');
    })
    .alterTable('services', (table) => {
      table.dropColumn('photo_url');
    })
    .alterTable('organizations', (table) => {
      table.dropColumn('photo_url');
    })
    .alterTable('resources', (table) => {
      table.dropColumn('photo_url');
    });
};
