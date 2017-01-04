import { sources } from '../api/narratives/narrative-module-sources';

exports.up = function(knex, Promise) {
  return knex.schema
    // Narrative Tables
    .createTable('narrative_modules', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.text('description');
      table.string('abbreviation').notNullable().unique();
    })
    .createTable('narrative_intents', (table) => {
      table.increments('id').primary();
      table.integer('narrative_module_id')
        .unsigned().references('id').inTable('narrative_modules');
      table.string('name');
      table.text('description');
      table.string('intent_token');
    })
    .createTable('narrative_responses', (table) => {
      table.increments('id').primary();
      table.integer('organization_id')
        .unsigned().references('id').inTable('organizations');
      // The answer has references to events, facilities, schedules, etc
      table.string('response_id')
        .unsigned().references('id').inTable('knowledge_answers');
      table.string('intent_token');
    })
    // Junction Tables
    .createTable('narrative_modules_organizations_config', (table) => {
      table.increments('id').primary();
      table.integer('narrative_module_id');
        .unsigned().references('id').inTable('narrative_modules');
      // TO DO: Make a narrative_module_sources table that can be referenced
      // Timing to work out this feature feels premature
      table.enum('source', Object.keys(sources)).defaultTo('kit');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTable('narrative_responses')
    .dropTable('narrative_intents')
    .dropTable('narrative_modules');
};
