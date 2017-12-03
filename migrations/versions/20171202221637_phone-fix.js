
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('phones', (table) => {
      table.integer('organization_id')
        .unsigned().references('id').inTable('organizations');
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
      table.dateTime('updated_at');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('phones', (table) => {
      table.dropColumn('organization_id');
      table.dropColumn('created_at');
      table.dropColumn('updated_at');
    });
};
