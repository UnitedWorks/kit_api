
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('knowledge_answers', (table) => {
      table.dropColumn('prompt_id');
      table.jsonb('follow_up');
    })
    .createTable('shout_outs', (table) => {
      table.increment('id').primary();
      table.string('label').notNullable();
      table.jsonb('params');
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
      table.dateTime('updated_at');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTable('shout_outs')
    .alterTable('knowledge_answers', (table) => {
      table.dropColumn('follow_up');
      table.integer('prompt_id').unsigned().references('id').inTable('prompts');
    });
};
