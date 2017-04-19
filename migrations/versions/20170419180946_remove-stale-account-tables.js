
exports.up = function(knex, Promise) {
  return knex.schema
    .dropTable('case_category_representative_assignments')
    .dropTable('organizations_constituents')
    .dropTable('representatives_cases');
};

exports.down = function(knex, Promise) {
  return knex.schema
    .createTable('case_category_representative_assignments', (table) => {
      table.increments('id').primary();
      table.integer('case_category_id')
        .unsigned().references('id').inTable('case_categorys');
      table.integer('organization_id')
        .unsigned().references('id').inTable('organizations');
      table.integer('representative_id')
        .unsigned().references('id').inTable('representatives');
    })
    .createTable('organizations_constituents', (table) => {
      table.increments('id').primary();
      table.integer('organization_id')
        .unsigned().references('id').inTable('organizations');
      table.integer('constituent_id')
        .unsigned().references('id').inTable('constituents');
      table.string('type');
    })
    .createTable('representatives_cases', (table) => {
      table.increments('id').primary();
      table.integer('representative_id')
        .unsigned().references('id').inTable('representatives');
      table.integer('case_id')
        .unsigned().references('id').inTable('cases');
    });
};
