
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('resources', (table) => {
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
      table.dateTime('updated_at');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('resources', (table) => {
      table.dropColumn('created_at');
      table.dropColumn('updated_at');
    });
};
