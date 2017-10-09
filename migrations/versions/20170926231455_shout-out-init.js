
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('knowledge_answers', (table) => {
      table.dropColumn('prompt_id');
      table.jsonb('actions');
    })
    .alterTable('prompts', (table) => {
      table.dropColumn('label');
    })
    .createTable('shout_outs', (table) => {
      table.increments('id').primary();
      table.string('label').notNullable();
      table.integer('constituent_id')
        .unsigned().references('id').inTable('constituents');
      table.jsonb('params');
      table.integer('task_id').unsigned().references('id').inTable('tasks');
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
      table.dateTime('updated_at');
      table.dateTime('assigned_at'); // When its associted with a task?
      table.dateTime('resolved_at'); // When it's been closed/resolved with or without a task?
    })
    .createTable('shout_out_triggers', (table) => {
      table.increments('id').primary();
      table.string('label').notNullable();
      table.integer('organization_id').unsigned().references('id').inTable('organizations');
      table.jsonb('actions'); // Ex) task: { seeclickfix: true } => means create SCF issue
    })
    .alterTable('tasks', (table) => {
      table.jsonb('managed'); // Always make a task, but offload responsibility
      table.dropColumn('meta'); // Contains SeeClickFix info that should now be in 'managed'
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTable('shout_outs')
    .dropTable('shout_out_triggers')
    .alterTable('knowledge_answers', (table) => {
      table.dropColumn('actions');
      table.integer('prompt_id').unsigned().references('id').inTable('prompts');
    })
    .alterTable('prompts', (table) => {
      table.string('label');
    })
    .alterTable('tasks', (table) => {
      table.dropColumn('managed');
      table.jsonb('meta');
    });
};
