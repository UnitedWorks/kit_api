
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('vehicles', (table) => {
      table.string('function');
      table.string('last_active_at');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('vehicles', (table) => {
      table.dropColumn('function');
      table.dropColumn('last_active_at');
    });
};
