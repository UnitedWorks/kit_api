
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('knowledge_events', (table) => {
      table.dropColumn('knowledge_facility_id');
      table.dropColumn('knowledge_service_id');
      table.dropColumn('knowledge_category_id');
    })
    .alterTable('knowledge_services', (table) => {
      table.dropColumn('knowledge_category_id');
    })
    .alterTable('knowledge_facilitys', (table) => {
      table.dropColumn('knowledge_category_id');
    })

    .renameTable('knowledge_facilitys', 'places')
    .renameTable('knowledge_services', 'services')
    .renameTable('knowledge_contacts', 'persons')
    .renameTable('knowledge_events', 'events')

    .alterTable('knowledge_answers', (table) => {
      table.dropForeign('knowledge_facility_id');
      table.dropForeign('knowledge_service_id');
      table.dropForeign('knowledge_contact_id');
      table.dropForeign('knowledge_event_id');

      table.renameColumn('knowledge_facility_id', 'place_id');
      table.foreign('place_id').references('places.id');
      table.renameColumn('knowledge_service_id', 'service_id');
      table.foreign('service_id').references('services.id');
      table.renameColumn('knowledge_contact_id', 'person_id');
      table.foreign('person_id').references('persons.id');
      table.renameColumn('knowledge_event_id', 'event_id');
      table.foreign('event_id').references('events.id');

      table.renameColumn('question_id', 'knowledge_question_id');
    })

    .alterTable('knowledge_question_stats', (table) => {
      table.renameColumn('question_id', 'knowledge_question_id');
    })
    .renameTable('knowledge_question_stats', 'knowledge_questions_stats')

    .alterTable('knowledge_categorys_knowledge_contacts', (table) => {
      table.dropForeign('knowledge_contact_id');
      table.renameColumn('knowledge_contact_id', 'person_id');
      table.foreign('person_id').references('persons.id');
    })
    .renameTable('knowledge_categorys_knowledge_contacts', 'knowledge_categorys_persons');
};

exports.down = function(knex, Promise) {
  return knex.schema
    .renameTable('places', 'knowledge_facilitys')
    .renameTable('services', 'knowledge_services')
    .renameTable('persons', 'knowledge_contacts')
    .renameTable('events', 'knowledge_events')

    .alterTable('knowledge_answers', (table) => {
      table.dropForeign('place_id');
      table.dropForeign('service_id');
      table.dropForeign('person_id');
      table.dropForeign('event_id');

      table.renameColumn('place_id', 'knowledge_facility_id');
      table.foreign('knowledge_facility_id').references('knowledge_facilitys.id');
      table.renameColumn('service_id', 'knowledge_service_id');
      table.foreign('knowledge_service_id').references('knowledge_services.id');
      table.renameColumn('person_id', 'knowledge_contact_id');
      table.foreign('knowledge_contact_id').references('knowledge_contacts.id');
      table.renameColumn('event_id', 'knowledge_event_id');
      table.foreign('knowledge_event_id').references('knowledge_events.id');

      table.renameColumn('knowledge_question_id', 'question_id');
    })

    .alterTable('knowledge_questions_stats', (table) => {
      table.renameColumn('knowledge_question_id', 'question_id');
    })
    .renameTable('knowledge_questions_stats', 'knowledge_question_stats')

    .alterTable('knowledge_categorys_knowledge_contacts', (table) => {
      table.dropForeign('person_id');
      table.renameColumn('person_id', 'knowledge_contact_id');
      table.foreign('knowledge_contact_id').references('knowledge_contacts.id');
    })
    .renameTable('knowledge_categorys_persons', 'knowledge_categorys_knowledge_contacts');
};
