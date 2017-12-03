
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('organizations_entity_associations', (table) => {
      table.integer('organization_id').notNullable().alter();
      table.integer('media_id').unsigned().references('id').inTable('medias');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('organizations_entity_associations', (table) => {
      table.integer('organization_id').nullable().alter();
      table.dropColumn('media_id');
    });
};
