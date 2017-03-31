
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('organizations', (table) => {
      table.dropColumn('abbreviation');
      table.dropColumn('category');
      table.dropColumn('type');
    })
    .alterTable('organizations', (table) => {
      table.enum('type', ['government', 'provider']).defaultTo('government');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('organizations', (table) => {
      table.dropColumn('type');
    })
    .alterTable('organizations', (table) => {
      table.string('abbreviation');
      table.enum('category', ['public', 'ngo', 'private']);
      table.enum('type', ['admin', 'division']);
    });
};
