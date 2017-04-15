
exports.up = function(knex, Promise) {
    return knex.schema
      .alterTable('representatives', (table) => {
        table.dropColumn('salt');
        table.dateTime('updated_at');
      });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('representatives', (table) => {
      table.dropColumn('updated_at');
      table.string('salt');
    });
};
