
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('constituents', (table) => {
      table.string('entry_phone_number');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('constituents', (table) => {
      table.dropColumn('entry_phone_number');
    });
};
