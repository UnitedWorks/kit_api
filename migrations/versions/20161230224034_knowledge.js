
exports.up = function(knex, Promise) {
  return knex.schema
    // Primitive Knowledge Tables
    .createTable('locations', (table) => {
      table.increments('id').primary();
    })
    .createTable('schedules', (table) => {
      table.increments('id').primary();
    })
    .createTable('medias', (table) => {
      table.increments('id').primary();
      table.string('name');
      table.string('type');
      table.string('url');
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
    })
    // Complex Knowledge Tables
    .createTable('knowledge_categorys', (table) => {
      table.increments('id').primary();
      table.string('label');
    })
    .createTable('knowledge_facility_types', (table) => {
      table.increments('id').primary();
      table.string('label');
    })
    .createTable('knowledge_facilitys', (table) => {
      table.increments('id');
      table.string('name');
      table.text('description');
      table.integer('category_id')
        .unsigned().references('id').inTable('knowledge_categorys');
      table.integer('type_id')
        .unsigned().references('id').inTable('knowledge_facility_types');
      table.integer('schedule_id')
        .unsigned().references('id').inTable('schedules');
      table.integer('location_id')
        .unsigned().references('id').inTable('locations');
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
    })
    .createTable('knowledge_services', (table) => {
      table.increments('id').primary();
      table.string('name');
      table.text('description');
      table.integer('category_id')
        .unsigned().references('id').inTable('knowledge_categorys');
      table.integer('schedule_id')
        .unsigned().references('id').inTable('schedules');
      table.integer('location_id')
        .unsigned().references('id').inTable('locations');
      table.integer('facility_id')
        .unsigned().references('id').inTable('knowledge_facilitys');
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
    })
    .createTable('knowledge_events', (table) => {
      table.increments('id').primary();
      table.string('name');
      table.text('description');
      table.integer('category_id')
        .unsigned().references('id').inTable('knowledge_categorys');
      table.integer('schedule_id')
        .unsigned().references('id').inTable('schedules');
      table.integer('location_id')
        .unsigned().references('id').inTable('locations');
      table.integer('facility_id')
        .unsigned().references('id').inTable('knowledge_facilitys');
      table.integer('service_id')
        .unsigned().references('id').inTable('knowledge_services');
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
    })
    .createTable('knowledge_answers', (table) => {
      table.increments('id').primary();
      table.text('question');
      table.text('answer');
      table.integer('category_id')
        .unsigned().references('id').inTable('knowledge_categorys');
      table.string('url');
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
    })
    // Tables for Associations
    .createTable('knowledge_answer_events', (table) => {
      table.integer('answer_id')
        .unsigned().references('id').inTable('knowledge_answers');
      table.integer('event_id')
        .unsigned().references('id').inTable('knowledge_events');
    })
    .createTable('knowledge_answer_services', (table) => {
      table.integer('answer_id')
        .unsigned().references('id').inTable('knowledge_answers');
      table.integer('service_id')
        .unsigned().references('id').inTable('knowledge_services');
    })
    .createTable('knowledge_answer_facilitys', (table) => {
      table.integer('answer_id')
        .unsigned().references('id').inTable('knowledge_answers');
      table.integer('facility_id')
        .unsigned().references('id').inTable('knowledge_facilitys');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTable('knowledge_answer_events')
    .dropTable('knowledge_answer_services')
    .dropTable('knowledge_answer_facilitys')
    .dropTable('knowledge_answers')
    .dropTable('knowledge_events')
    .dropTable('knowledge_services')
    .dropTable('knowledge_facilitys')
    .dropTable('knowledge_facility_types')
    .dropTable('knowledge_categorys')
    .dropTable('locations')
    .dropTable('schedules')
    .dropTable('medias');
};
