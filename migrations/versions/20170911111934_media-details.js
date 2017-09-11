
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('medias', (table) => {
      table.string('filename');
      table.string('description');
      table.string('facebook_attachment_id');
      table.integer('organization_id').unsigned().references('id').inTable('organizations');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('medias', (table) => {
      table.dropColumn('filename');
      table.dropColumn('description');
      table.dropColumn('facebook_attachment_id');
      table.dropColumn('organization_id');
    });
};
