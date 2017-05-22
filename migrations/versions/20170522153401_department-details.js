
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('knowledge_category_responsibilitys', (table) => {
      table.dropColumn('knowledge_department_id');
    })
    .alterTable('knowledge_contacts', (table) => {
      table.dropColumn('knowledge_department_id');
      table.dropColumn('point_of_contact');
    })
    .dropTable('knowledge_departments')
    .renameTable('knowledge_category_responsibilitys', 'knowledge_categorys_knowledge_contacts');
};

exports.down = function(knex, Promise) {
  return knex.schema
    // Departments
    .createTable('knowledge_departments', (table) => {
      table.increments('id').primary();
      table.string('name');
      table.text('brief_description');
      table.text('responsibilities');
      table.integer('organization_id')
        .unsigned().references('id').inTable('organizations');
      table.datetime('created_at').defaultTo(knex.raw('now()'));
      table.datetime('updated_at');
    })
    // Junction Table
    .alterTable('knowledge_category_responsibilitys', (table) => {
      table.integer('knowledge_department_id')
        .unsigned().references('id').inTable('knowledge_departments');
    })
    // Contacts
    .alterTable('knowledge_contacts', (table) => {
      table.boolean('point_of_contact').defaultTo(false);
      table.integer('knowledge_department_id')
        .unsigned().references('id').inTable('knowledge_departments');
    })
    .renameTable('knowledge_categorys_knowledge_contacts', 'knowledge_category_responsibilitys');
};
