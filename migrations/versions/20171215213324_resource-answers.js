
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('knowledge_answers', (table) => {
      table.integer('resource_id').unsigned().references('id').inTable('resources');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('knowledge_answers', (table) => {
      table.dropColumn('resource_id');
    });
};
