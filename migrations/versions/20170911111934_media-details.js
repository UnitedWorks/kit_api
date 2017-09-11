
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('medias', (table) => {
      table.string('filename');
      table.string('description');
      table.integer('organization_id').unsigned().references('id').inTable('organizations');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('medias', (table) => {
      table.dropColumn('filename');
      table.dropColumn('description');
      table.dropColumn('organization_id');
    });
};
