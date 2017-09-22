
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('feeds', (table) => {
      table.dropColumn('url');
      table.boolean('watcher').defaultTo(false);
      table.jsonb('config');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('feeds', (table) => {
      table.dropColumn('watcher');
      table.dropColumn('config');
      table.string('url');
    });
};
