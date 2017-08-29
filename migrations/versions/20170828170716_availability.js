
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('knowledge_services', (table) => {
      table.specificType('availabilitys', 'jsonb[]');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('knowledge_services', (table) => {
      table.dropColumn('availabilitys');
    });
};
