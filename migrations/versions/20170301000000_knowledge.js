
exports.up = function(knex, Promise) {
  return knex.schema
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
      table.integer('knowledge_category_id')
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
      table.integer('knowledge_category_id')
        .unsigned().references('id').inTable('knowledge_categorys');
      table.integer('schedule_id')
        .unsigned().references('id').inTable('schedules');
      table.integer('location_id')
        .unsigned().references('id').inTable('locations');
      table.integer('knowledge_facility_id')
        .unsigned().references('id').inTable('knowledge_facilitys');
      table.integer('organization_id')
        .unsigned().references('id').inTable('organizations');
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
    })
    .createTable('knowledge_events', (table) => {
      table.increments('id').primary();
      table.string('name');
      table.text('description');
      table.integer('knowledge_category_id')
        .unsigned().references('id').inTable('knowledge_categorys');
      table.integer('schedule_id')
        .unsigned().references('id').inTable('schedules');
      table.integer('location_id')
        .unsigned().references('id').inTable('locations');
      table.integer('knowledge_facility_id')
        .unsigned().references('id').inTable('knowledge_facilitys');
      table.integer('knowledge_service_id')
        .unsigned().references('id').inTable('knowledge_services');
      table.integer('organization_id')
        .unsigned().references('id').inTable('organizations');
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
    })
    .createTable('knowledge_questions', (table) => {
      table.increments('id').primary();
      table.string('label');
      table.integer('knowledge_category_id')
        .unsigned().references('id').inTable('knowledge_categorys');
      table.text('question');
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
      table.dateTime('updated_at');
    })
    .createTable('knowledge_answers', (table) => {
      table.increments('id').unsigned().primary();

      table.integer('organization_id').notNullable().references('organizations.id');
      table.integer('question_id').notNullable().references('knowledge_questions.id');

      table.dateTime('created_at').defaultTo(knex.raw('now()'));
      table.dateTime('updated_at');

      table.text('text');
      table.string('url');

      table.integer('knowledge_event_id').references('knowledge_events.id');
      table.integer('knowledge_service_id').references('knowledge_services.id');
      table.integer('knowledge_facility_id').references('knowledge_facilitys.id');
      table.integer('media_id').references('medias.id');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTable('knowledge_answers')
    .dropTable('knowledge_questions')
    .dropTable('knowledge_events')
    .dropTable('knowledge_services')
    .dropTable('knowledge_facilitys')
    .dropTable('knowledge_facility_types')
    .dropTable('knowledge_categorys');
};
