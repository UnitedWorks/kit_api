
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('tasks', (table) => {
    table.jsonb('params').nullable().alter();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.alterTable('tasks', (table) => {
    table.jsonb('params').notNullable().alter();
  });
};
