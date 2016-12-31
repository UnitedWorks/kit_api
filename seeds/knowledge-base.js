import * as KnowledgeConstants from '../api/constants/knowledge-base';

exports.seed = function(knex, Promise) {

  const categorySeed = [];
  let categoryIds;
  KnowledgeConstants.CATEGORIES.forEach((category) => {
    categorySeed.push(knex('knowledge_categorys').insert({
      label: category,
    }, 'ids').then((ids) => { categoryIds = ids; }));
  });

  const facilityTypeSeed = [];
  let faciltiyTypeId;
  KnowledgeConstants.FACILITY_TYPES.forEach((type) => {
    categorySeed.push(knex('knowledge_facility_types').insert({
      label: type,
    }, 'id').then((ids) => { faciltiyTypeId = ids[0]; }));
  });

  const locationSeed = [];
  let locationIds;
  locationSeed.push(knex('locations').insert([{}, {}], 'id').then((ids) => {
    locationIds = ids;
  }));

  const scheduleSeed = [];
  let scheduleIds;
  scheduleSeed.push(knex('locations').insert([{}, {}, {}], 'id').then((ids) => {
    scheduleIds = ids;
  }));

  const facilitiesSeed = [];
  let facilityId;
  facilitiesSeed.push(knex('knowledge_facilitys').insert({
    name: 'Job Training Center',
    description: 'Walk in center for education, job search help, and other resources.',
    type_id: faciltiyTypeId,
    schedule_id: scheduleIds[0], // Refers to hours of operation
    location_id: locationIds[0], // Geolocation of facility
    category_id: categoryIds[0],
  }, 'id').then((ids) => { facilityId = ids[0]; }));

  const servicesSeed = [];
  let serviceId;
  servicesSeed.push(knex('knowledge_services').insert({
    name: 'Computer Training',
    description: 'Introduction to word and data processing programs',
    category_id: categoryIds[0],
    schedule_id: scheduleIds[1], // Refers to the schedule of the class
    facility_id: facilityId, // Refers to the job center
  }, 'id').then((ids) => { serviceId = ids[0]; }));

  const eventsSeed = [];
  let eventId;
  eventsSeed.push(knex('knowledge_events').insert({
    name: 'Computer Training Information Session',
    description: 'A quick overview',
    schedule_id: scheduleIds[3], // Refers to a single time period
    facility_id: facilityId, // Refers to the job center
    service_id: serviceId, // Refers to the computer training course
  }, 'id').then((ids) => { eventId = ids[0]; }));

  const answersSeed = [];
  let answerId;
  answersSeed.push(knex('knowledge_answers').insert({
    question: 'Where can I get basic computer training?',
    answer: 'The city provides training for jobs around the year. Be sure to visit a job center or check our website',
    category_id: categoryIds[0],
    url: 'http://www1.nyc.gov/nyc-resources/service/2984/nyc-job-training-guide',
  }, 'id').then((ids) => { answerId = ids[0]; }));

  const relationshipsSeed = [];
  relationshipsSeed.push(knex('knowledge_answer_events').insert({
    answer_id: answerId,
    event_id: eventId,
  }));
  relationshipsSeed.push(knex('knowledge_answer_services').insert({
    answer_id: answerId,
    service_id: serviceId,
  }));
  relationshipsSeed.push(knex('knowledge_answer_facilitys').insert({
    answer_id: answerId,
    facility_id: facilityId,
  }));

  // First, insert documents that'll later be referenced
  return Promise.all([
    ...categorySeed,
    ...facilityTypeSeed,
    ...locationSeed,
    ...scheduleSeed,
  ]).then(() => {
    // Second, insert knowledge documents that need prior references
    return Promise.all([
      ...facilitiesSeed,
    ]).then(() => {
      return Promise.all([
        ...servicesSeed,
      ]).then(() => {
        // Third, make an answer referencing prior knowledge entries
        return Promise.all([
          ...eventsSeed,
          ...answersSeed,
        ]).then(() => {
          return Promise.all([
            ...relationshipsSeed,
          ]);
        });
      });
    });
  });
};
