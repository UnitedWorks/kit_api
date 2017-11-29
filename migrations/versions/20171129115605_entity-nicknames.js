
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('organizations', (table) => {
      table.specificType('alternate_names', 'text[]');
    })
    .alterTable('knowledge_contacts', (table) => {
      table.specificType('alternate_names', 'text[]');
    })
    .alterTable('knowledge_facilitys', (table) => {
      table.specificType('alternate_names', 'text[]');
    })
    .alterTable('knowledge_services', (table) => {
      table.specificType('alternate_names', 'text[]');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('organizations', (table) => {
      table.dropColumn('alternate_names');
    })
    .alterTable('knowledge_contacts', (table) => {
      table.dropColumn('alternate_names');
    })
    .alterTable('knowledge_facilitys', (table) => {
      table.dropColumn('alternate_names');
    })
    .alterTable('knowledge_services', (table) => {
      table.dropColumn('alternate_names');
    });
};
