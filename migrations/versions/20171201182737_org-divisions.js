
exports.up = function(knex, Promise) {
  return knex.schema
    .raw('ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_type_check')
    .alterTable('organizations', (table) => {
      table.dropColumn('email');
      table.dropColumn('phone');
      table.dropColumn('activated');
      table.text('description');
      table.string('type').alter();
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .raw('ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_type_check')
    .alterTable('organizations', (table) => {
      table.string('email');
      table.string('phone');
      table.boolean('activated').defaultTo(false);
      table.dropColumn('description');
      table.string('type').alter();
    });
};
