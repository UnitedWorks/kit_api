
exports.up = function(knex, Promise) {
  return knex.schema
    // Alter Constituents to add responsibilities
    .alterTable('knowledge_contacts', (table) => {
      table.renameColumn('first_name', 'name');
      table.dropColumn('middle_name');
      table.dropColumn('last_name');
      table.text('responsibilities');
      table.dropColumn('birthday');
      table.dropColumn('organization');
    })
    // Category Expansion
    .alterTable('knowledge_categorys', (table) => {
      table.string('name');
    })
    // Junction Table
    .createTable('knowledge_categorys_knowledge_contacts', (table) => {
      table.increments('id').primary();
      table.integer('knowledge_category_id')
        .unsigned().references('id').inTable('knowledge_categorys');
      table.integer('knowledge_contact_id')
        .unsigned().references('id').inTable('knowledge_contacts');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('knowledge_contacts', (table) => {
      table.renameColumn('name', 'first_name');
      table.string('middle_name');
      table.string('last_name');
      table.datetime('birthday');
      table.string('organization');
      table.dropColumn('responsibilities');
    })
    .alterTable('knowledge_categorys', (table) => {
      table.dropColumn('name');
    })
    .dropTable('knowledge_categorys_knowledge_contacts')
};
