
exports.up = function(knex, Promise) {
  return knex.schema
    // Departments
    .createTable('knowledge_departments', (table) => {
      table.increments('id').primary();
      table.string('name');
      table.text('brief_description');
      table.text('responsibilities');
      table.datetime('created_at').defaultTo(knex.raw('now()'));
      table.datetime('updated_at');
    })
    // Alter Constituents to add responsibilities
    .alterTable('knowledge_contacts', (table) => {
      table.renameColumn('first_name', 'name');
      table.dropColumn('middle_name');
      table.dropColumn('last_name');
      table.text('responsibilities');
      table.integer('knowledge_department_id')
        .unsigned().references('id').inTable('knowledge_departments');
      table.dropColumn('birthday');
      table.dropColumn('organization');
      table.boolean('point_of_contact').defaultTo(false);
    })
    // Category Expansion
    .alterTable('knowledge_categorys', (table) => {
      table.string('name');
    })
    // Junction Table
    .createTable('knowledge_category_responsibilitys', (table) => {
      table.increments('id').primary();
      table.integer('knowledge_category_id')
        .unsigned().references('id').inTable('knowledge_categorys');
      table.integer('knowledge_department_id')
        .unsigned().references('id').inTable('knowledge_departments');
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
      table.dropColumn('knowledge_department_id');
      table.dropColumn('point_of_contact');
    })
    .alterTable('knowledge_categorys', (table) => {
      table.dropColumn('name');
    })
    .dropTable('knowledge_category_responsibilitys')
    .dropTable('knowledge_departments');
};
