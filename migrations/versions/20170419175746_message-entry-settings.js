
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('message_entrys', (table) => {
      table.boolean('persistent_menu_enabled').defaultTo(false);
      table.boolean('starting_action_enabled').defaultTo(false);
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('message_entrys', (table) => {
      table.dropColumn('persistent_menu_enabled');
      table.dropColumn('starting_action_enabled');
    });
};
