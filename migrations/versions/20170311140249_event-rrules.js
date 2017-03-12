
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('event_rules', (table) => {
      table.dropColumn('dt_start');
      table.dropColumn('dt_end');
      table.time('t_start');
      table.time('t_end');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('event_rules', (table) => {
      table.dropColumn('t_start');
      table.dropColumn('t_end');
      table.dateTime('dt_start');
      table.dateTime('dt_end');
    });
};
