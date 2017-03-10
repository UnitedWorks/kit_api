
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('knowledge_answers', (table) => {
      table.dropUnique(['organization_id', 'question_id']);
      table.dateTime('expiration');
    })
    .alterTable('knowledge_facilitys', (table) => {
      table.text('brief_description');
      table.text('eligibility_information');
      table.string('url');
      table.string('phone_number');
    })
    .alterTable('knowledge_services', (table) => {
      table.text('brief_description');
      table.dateTime('expiration');
      table.string('url');
      table.string('phone_number');
    })
    .alterTable('knowledge_events', (table) => {
      table.text('brief_description');
      table.string('url');
      table.string('phone_number');
    })
    .alterTable('medias', (table) => {
      table.string('original_url');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('knowledge_answers', (table) => {
      table.unique(['organization_id', 'question_id']);
      table.dropColumn('expiration');
    })
    .alterTable('knowledge_facilitys', (table) => {
      table.dropColumn('brief_description');
      table.dropColumn('eligibility_information');
      table.dropColumn('url');
      table.dropColumn('phone_number');
    })
    .alterTable('knowledge_services', (table) => {
      table.dropColumn('brief_description');
      table.dropColumn('expiration');
      table.dropColumn('url');
      table.dropColumn('phone_number');
    })
    .alterTable('knowledge_events', (table) => {
      table.dropColumn('brief_description');
      table.dropColumn('url');
      table.dropColumn('phone_number');
    })
    .alterTable('medias', (table) => {
      table.dropColumn('original_url');
    });
};
