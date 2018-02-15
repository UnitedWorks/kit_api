
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('availabilitys', (table) => {
      // Simply associate availabilitys with organizations, like places/services
      table.integer('organization_id').unsigned().references('id').inTable('organizations');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('availabilitys', (table) => {
      table.dropColumn('organization_id');
    });
};
