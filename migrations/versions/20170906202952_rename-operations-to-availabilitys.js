
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('knowledge_services', (table) => {
      table.renameColumn('operations', 'availabilitys');
    })
    .alterTable('knowledge_facilitys', (table) => {
      table.renameColumn('operations', 'availabilitys');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('knowledge_services', (table) => {
      table.renameColumn('availabilitys', 'operations');
    })
    .alterTable('knowledge_facilitys', (table) => {
      table.renameColumn('availabilitys', 'operations');
    });
};
