
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('prompt_steps', (table) => {
      table.dropColumn('position');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('prompt_steps', (table) => {
      table.integer('position');
    });
};
