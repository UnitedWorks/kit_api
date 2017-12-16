
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('knowledge_categorys_fallbacks', (table) => {
      table.increments('id').primary();
      table.integer('organization_id').unsigned().references('id').inTable('organizations');
      table.integer('knowledge_category_id').unsigned().references('id').inTable('knowledge_categorys');
      table.text('message');
      table.integer('person_id').unsigned().references('id').inTable('persons');
      table.integer('resource_id').unsigned().references('id').inTable('resources');
      table.integer('phone_id').unsigned().references('id').inTable('phones');
      table.integer('representative_id').unsigned().references('id').inTable('representatives');
    })
    .dropTable('knowledge_categorys_persons')
    .dropTable('knowledge_categorys_representatives');
};

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTable('knowledge_categorys_fallbacks')
    .createTable('knowledge_categorys_persons', (table) => {
      table.increments('id').primary();
      table.integer('knowledge_category_id').unsigned().references('id').inTable('knowledge_categorys');
      table.integer('organization_id').unsigned().references('id').inTable('organizations');
      table.integer('person_id').unsigned().references('id').inTable('persons');
    })
    .createTable('knowledge_categorys_representatives', (table) => {
      table.increments('id').primary();
      table.integer('knowledge_category_id').unsigned().references('id').inTable('knowledge_categorys');
      table.integer('organization_id').unsigned().references('id').inTable('organizations');
      table.integer('representative_id').unsigned().references('id').inTable('representatives');
    });
};
