
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('knowledge_contacts', (table) => {
      table.string('website');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('knowledge_contacts', (table) => {
      table.dropColumn('website');
    });
};
