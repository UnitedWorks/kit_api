
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('knowledge_categorys_representatives', (table) => {
      table.increments('id').primary();
      table.integer('knowledge_category_id')
        .unsigned().references('id').inTable('knowledge_categorys');
      table.integer('representative_id')
        .unsigned().references('id').inTable('representatives');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('knowledge_categorys_representatives');
};
