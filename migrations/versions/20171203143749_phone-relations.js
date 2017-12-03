
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('phones_entity_associations', (table) => {
      table.increments().primary();
      table.integer('phone_id').unsigned().references('phones.id');
      table.integer('event_id').unsigned().references('events.id');
      table.integer('place_id').unsigned().references('places.id');
      table.integer('person_id').unsigned().references('persons.id');
      table.integer('service_id').unsigned().references('services.id');
    })
    .alterTable('knowledge_answers', (table) => {
      table.integer('phone_id').unsigned().references('phones.id');
    })
    .alterTable('events', table => table.dropColumn('phone_number'))
    .alterTable('places', table => table.dropColumn('phone_number'))
    .alterTable('persons', table => table.dropColumn('phone_number'))
    .alterTable('services', table => table.dropColumn('phone_number'));
};

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTable('phones_entity_associations')
    .alterTable('knowledge_answers', table => table.dropColumn('phone_id'))
    .alterTable('events', table => table.string('phone_number'))
    .alterTable('places', table => table.string('phone_number'))
    .alterTable('persons', table => table.string('phone_number'))
    .alterTable('services', table => table.string('phone_number'));
};
