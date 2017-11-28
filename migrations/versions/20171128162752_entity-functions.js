
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('knowledge_services', (table) => {
      table.dropColumn('knowledge_facility_id');
      table.specificType('functions', 'text[]');
    })
    .alterTable('knowledge_facilitys', (table) => {
      table.specificType('functions', 'text[]');
    })
    .alterTable('organizations', (table) => {
      table.specificType('functions', 'text[]');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('knowledge_services', (table) => {
      table.integer('knowledge_facility_id').references('knowledge_facilitys.id');
      table.dropColumn('functions');
    })
    .alterTable('knowledge_facilitys', (table) => {
      table.dropColumn('functions');
    })
    .alterTable('organizations', (table) => {
      table.dropColumn('functions');
    });
};
