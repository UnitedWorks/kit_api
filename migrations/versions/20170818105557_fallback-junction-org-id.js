
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('knowledge_categorys_representatives', (table) => {
      table.integer('organization_id').unsigned().references('id').inTable('organizations');
    })
    .alterTable('knowledge_categorys_knowledge_contacts', (table) => {
      table.integer('organization_id').unsigned().references('id').inTable('organizations');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
  .alterTable('knowledge_categorys_representatives', (table) => {
    table.dropColumn('organization_id');
  })
  .alterTable('knowledge_categorys_knowledge_contacts', (table) => {
    table.dropColumn('organization_id');
  });
};
