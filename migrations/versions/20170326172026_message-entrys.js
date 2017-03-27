
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('message_entrys', (table) => {
      table.increments('id').primary();
      table.string('name');
      table.string('phone_number');
      table.string('facebook_entry_id');
      table.string('access_token');
      table.integer('organization_id')
        .unsigned().references('id').inTable('organizations');
    })
    .alterTable('constituents', (table) => {
      table.string('facebook_entry_id');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTable('message_entrys')
    .alterTable('constituents', (table) => {
      table.dropColumn('facebook_entry_id');
    });
};
