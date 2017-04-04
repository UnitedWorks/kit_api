
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('knowledge_contacts', (table) => {
      table.increments('id').primary();
      table.string('first_name');
      table.string('middle_name');
      table.string('last_name');
      table.string('title');
      table.string('organization');
      table.string('phone_number');
      table.string('email');
      table.date('birthday');
      table.datetime('created_at');
      table.datetime('updated_at');
      table.integer('photo_id').references('medias.id');
      table.integer('organization_id').references('organizations.id');
    })
    .alterTable('knowledge_answers', (table) => {
      table.integer('knowledge_contact_id').references('knowledge_contacts.id');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('knowledge_answers', (table) => {
      table.dropColumn('knowledge_contact_id');
    })
    .dropTable('knowledge_contacts');
};
