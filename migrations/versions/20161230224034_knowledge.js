
exports.up = function(knex, Promise) {
  return knex.schema
    // Primitive Knowledge Tables
    .createTable('locations', (table) => {
      table.increments('id').primary();
      table.integer('organization_id')
        .unsigned().references('id').inTable('organizations');
    })
    .createTable('schedules', (table) => {
      table.increments('id').primary();
      table.integer('organization_id')
        .unsigned().references('id').inTable('organizations');
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
      table.increments('id').primary();
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
      table.integer('organization_id')
        .unsigned().references('id').inTable('organizations');
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
      table.integer('organization_id')
        .unsigned().references('id').inTable('organizations');
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
      table.integer('organization_id')
        .unsigned().references('id').inTable('organizations');
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
    })
    .createTable('knowledge_answers', (table) => {
      table.increments('id').primary();
      table.string('label').unique();
      table.text('question');
      table.text('answer');
      table.integer('category_id')
        .unsigned().references('id').inTable('knowledge_categorys');
      table.string('url');
      table.integer('organization_id')
        .unsigned().references('id').inTable('organizations');
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
    })
    // Junction Tables
    .createTable('knowledge_answers_knowledge_events', (table) => {
      table.increments('id').primary();
      table.integer('knowledge_answer_id').notNullable()
        .unsigned().references('id').inTable('knowledge_answers');
      table.integer('knowledge_event_id').notNullable()
        .unsigned().references('id').inTable('knowledge_events');
    })
    .createTable('knowledge_answers_knowledge_services', (table) => {
      table.increments('id').primary();
      table.integer('knowledge_answer_id').notNullable()
        .unsigned().references('id').inTable('knowledge_answers');
      table.integer('knowledge_service_id').notNullable()
        .unsigned().references('id').inTable('knowledge_services');
    })
    .createTable('knowledge_answers_knowledge_facilitys', (table) => {
      table.increments('id').primary();
      table.integer('knowledge_answer_id').notNullable()
        .unsigned().references('id').inTable('knowledge_answers');
      table.integer('knowledge_facility_id').notNullable()
        .unsigned().references('id').inTable('knowledge_facilitys');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTable('knowledge_answers_knowledge_events')
    .dropTable('knowledge_answers_knowledge_services')
    .dropTable('knowledge_answers_knowledge_facilitys')
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
