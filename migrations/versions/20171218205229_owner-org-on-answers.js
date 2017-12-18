
exports.up = function(knex, Promise) {
  return Promise.resolve()
    .then(() => knex.schema.alterTable('knowledge_answers', (table) => {
      table.integer('owner_organization_id').unsigned().references('id').inTable('organizations');
      table.integer('organization_id').nullable().alter();
    }))
    .then(() => knex.raw('UPDATE knowledge_answers SET owner_organization_id = organization_id'))
    .then(() => knex.raw('UPDATE knowledge_answers SET organization_id = NULL'))
    .then(() => knex.schema.alterTable('knowledge_answers', (table) => {
      table.integer('owner_organization_id').notNullable().alter();
    }));
};

exports.down = function(knex, Promise) {
  return Promise.resolve()
    .then(() => knex.raw('UPDATE knowledge_answers set organization_id = owner_organization_id'))
    .then(() => knex.schema.alterTable('knowledge_answers', (table) => {
      table.integer('organization_id').notNullable().alter();
      table.dropColumn('owner_organization_id');
    }));
};
