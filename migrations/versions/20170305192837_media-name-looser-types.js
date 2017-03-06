
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('medias', (table) => {
      table.string('name');
    })
    .raw('ALTER TABLE medias ALTER COLUMN type DROP NOT NULL');
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('medias', (table) => {
      table.dropColumn('name');
    })
    .raw(`UPDATE medias SET type='file' WHERE type IS NULL; ALTER TABLE medias ALTER COLUMN type SET NOT NULL`);
};
