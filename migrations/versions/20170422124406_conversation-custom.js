
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('message_entrys', (table) => {
      table.string('intro_name');
      table.string('intro_picture_url');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('message_entrys', (table) => {
      table.dropColumn('intro_name');
      table.dropColumn('intro_picture_url');
    });
};
