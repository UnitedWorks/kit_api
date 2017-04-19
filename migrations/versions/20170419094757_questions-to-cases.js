
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('cases', (table) => {
      table.dropColumn('data');
      table.enum('type', ['request', 'statement']);
      table.text('description');
      table.dateTime('updated_at');
      table.text('response');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('cases', (table) => {
      table.dropColumn('type');
      table.dropColumn('description');
      table.dropColumn('updated_at');
      table.dropColumn('response');
      table.jsonb('data');
    });
};
