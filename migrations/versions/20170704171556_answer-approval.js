
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('representatives', (table) => {
      table.boolean('admin').defaultTo(false);
    })
    .alterTable('knowledge_answers', (table) => {
      table.dateTime('approved_at');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('representatives', (table) => {
      table.dropColumn('admin');
    })
    .alterTable('knowledge_answers', (table) => {
      table.dropColumn('approved_at');
    });
};
