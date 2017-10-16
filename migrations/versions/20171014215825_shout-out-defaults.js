
exports.up = function(knex, Promise) {
  return knex.schema
    .raw('ALTER TABLE integrations DROP CONSTRAINT IF EXISTS integrations_type_check')
    .alterTable('organizations_integrations', (table) => {
      table.jsonb('config'); // Probably should use this for SCF (mapping categories? saving org ID?)
    });
};

exports.down = function(knex, Promise) {
  return knex.scehma
    .alterTable('organizations_integrations', (table) => {
      table.dropColumn('config');
    });
};
