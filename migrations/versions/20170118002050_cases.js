
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('case_categorys', (table) => {
      table.increments('id').primary();
      table.string('label').notNullable();
      table.integer('parent_category_id')
        .unsigned().references('id').inTable('case_categorys');
    })
    .createTable('cases', (table) => {
      table.increments('id').primary();
      table.enum('status', ['open', 'closed']).defaultTo('open');
      table.integer('category_id')
        .unsigned().references('id').inTable('case_categorys');
      table.string('title');
      table.integer('constituent_id')
        .unsigned().references('id').inTable('constituents');
      table.jsonb('data');
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
      table.dateTime('closed_at');
    })
    .createTable('organizations_cases', (table) => {
      table.increments('id').primary();
      table.integer('organization_id')
        .unsigned().references('id').inTable('organizations');
      table.integer('case_id')
        .unsigned().references('id').inTable('cases');
    })
    .createTable('representatives_cases', (table) => {
      table.increments('id').primary();
      table.integer('representative_id')
        .unsigned().references('id').inTable('representatives');
      table.integer('case_id')
        .unsigned().references('id').inTable('cases');
    })
    .createTable('case_category_representative_assignments', (table) => {
      table.increments('id').primary();
      table.integer('case_category_id')
        .unsigned().references('id').inTable('case_categorys');
      table.integer('organization_id')
        .unsigned().references('id').inTable('organizations');
      table.integer('representative_id')
        .unsigned().references('id').inTable('representatives');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTable('organizations_cases')
    .dropTable('representatives_cases')
    .dropTable('case_category_representative_assignments')
    .dropTable('cases')
    .dropTable('case_categorys');
};
