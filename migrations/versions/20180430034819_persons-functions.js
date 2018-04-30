
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('persons', (table) => {
      table.specificType('functions', 'text[]');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('persons', (table) => {
      table.dropColumn('functions');
    });
};
