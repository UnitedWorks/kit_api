
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('knowledge_services', (table) => {
      table.specificType('operations', 'jsonb[]');
    })
    .alterTable('knowledge_facilitys', (table) => {
      table.specificType('operations', 'jsonb[]');
      table.renameColumn('type_id', 'knowledge_facility_type_id');
    })
    .alterTable('knowledge_contacts', (table) => {
      table.renameColumn('website', 'url');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('knowledge_services', (table) => {
      table.dropColumn('operations');
    })
    .alterTable('knowledge_facilitys', (table) => {
      table.dropColumn('operations');
      table.renameColumn('knowledge_facility_type_id', 'type_id');
    })
    .alterTable('knowledge_contacts', (table) => {
      table.renameColumn('url', 'website');
    });
};
