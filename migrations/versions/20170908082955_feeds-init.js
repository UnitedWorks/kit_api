
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('feeds', (table) => {
      table.increments('id').primary();
      table.string('name');
      table.text('description');
      table.string('format'); // 'ics'(ical), 'rss', 'script'
      table.string('entity'); // 'events', 'services' (?), 'facilitys' (?), 'traffic_lights' (?)
      table.string('topic'); // 'public_meetings' (?), 'council_meetings' (?), 'cultural' (?) - trying to think how I find a counci meeting. feels like event type
      table.string('url'); // For ICS/RSS
      table.text('script'); // For script data, we need to store and run a script script
      table.integer('organization_id').unsigned().references('id').inTable('organizations');
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
      table.dateTime('updated_at');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('feeds');
};
