
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('knowledge_answers', (table) => {
      table.dropColumn('url');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('knowledge_answers', (table) => {
      table.string('url');
    });
};
