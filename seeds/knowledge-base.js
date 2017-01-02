import fs from 'fs';
import { logger } from '../api/logger';
import * as KnowledgeConstants from '../api/constants/knowledge-base';

exports.seed = function(knex, Promise) {

  const categorySeed = (obj) => {
    const categoryInserts = [];
    KnowledgeConstants.CATEGORIES.forEach((category) => {
      categoryInserts.push(knex('knowledge_categorys').insert({
        label: category,
      }, 'id'));
    });
    return Promise.all(categoryInserts).then((data) => {
      obj['categoryIds'] = [].concat(...data);
      return facilityTypeSeed(obj);
    });
  };

  const facilityTypeSeed = (obj) => {
    const facilityTypeInserts = [];
    KnowledgeConstants.FACILITY_TYPES.forEach((type) => {
      facilityTypeInserts.push(knex('knowledge_facility_types').insert({
        label: type,
      }, 'id'));
    });
    return Promise.all(facilityTypeInserts).then((data) => {
      obj['facilityTypeIds'] = [].concat(...data);
      return locationSeed(obj);
    });
  };

  const locationSeed = (obj) => {
    const locationInserts = [];
    for (let i = 0; i < 2; i += 1) {
      locationInserts.push(knex('locations').insert({}, 'id'));
    }
    return Promise.all(locationInserts).then((data) => {
      obj['locationIds'] = [].concat(...data);
      return scheduleSeed(obj);
    });
  };

  const scheduleSeed = (obj) => {
    const scheduleInserts = [];
    for (let i = 0; i < 3; i += 1) {
      scheduleInserts.push(knex('schedules').insert({}, 'id'));
    }
    return Promise.all(scheduleInserts).then((data) => {
      obj['scheduleIds'] = [].concat(...data);
      return facilitySeed(obj);
    });
  };

  const facilitySeed = (obj) => {
    const facilitiesInserts = [];
    facilitiesInserts.push(knex('knowledge_facilitys').insert({
      name: 'Job Training Center',
      description: 'Walk in center for education, job search help, and other resources.',
      type_id: obj.facilityTypeIds[0],
      category_id: obj.categoryIds[0],
      schedule_id: obj.scheduleIds[0], // Refers to hours of operation
      location_id: obj.locationIds[0], // Geolocation of facility
    }, 'id'));
    return Promise.all(facilitiesInserts).then((data) => {
      obj['facilityIds'] = [].concat(...data);
      return serviceSeed(obj);
    });
  };

  const serviceSeed = (obj) => {
    const servicesInserts = [];
    servicesInserts.push(knex('knowledge_services').insert({
      name: 'Computer Training',
      description: 'Introduction to word and data processing programs',
      facility_id: obj.facilityIds[0], // Refers to the job center
      category_id: obj.categoryIds[0],
      schedule_id: obj.scheduleIds[1], // Refers to the schedule of the class
    }, 'id'));
    return Promise.all(servicesInserts).then((data) => {
      obj['serviceIds'] = [].concat(...data);
      return eventSeed(obj);
    });
  };

  const eventSeed = (obj) => {
    const eventsInserts = [];
    eventsInserts.push(knex('knowledge_events').insert({
      name: 'Computer Training Information Session',
      description: 'A quick overview',
      facility_id: obj.facilityIds[0], // Refers to the job center
      schedule_id: obj.scheduleIds[3], // Refers to a single time period
      service_id: obj.serviceIds[0], // Refers to the computer training course
    }, 'id'));
    return Promise.all(eventsInserts).then((data) => {
      obj['eventIds'] = [].concat(...data);
      return answerSeed(obj);
    });
  };

  const answerSeed = (obj) => {
    const answersInserts = [];
    answersInserts.push(knex('knowledge_answers').insert({
      question: 'Where can I get basic computer training?',
      answer: 'The city provides training for jobs around the year. Be sure to visit a job center or check our website',
      category_id: obj.categoryIds[0],
      url: 'http://www1.nyc.gov/nyc-resources/service/2984/nyc-job-training-guide',
    }, 'id'));
    return Promise.all(answersInserts).then((data) => {
      obj['answerIds'] = [].concat(...data);
      return relationshipSeed(obj);
    });
  };

  const relationshipSeed = (obj) => {
    const relationshipsInserts = [];
    relationshipsInserts.push(knex('knowledge_answer_events').insert({
      answer_id: obj.answerIds[0],
      event_id: obj.eventIds[0],
    }));
    relationshipsInserts.push(knex('knowledge_answer_services').insert({
      answer_id: obj.answerIds[0],
      service_id: obj.serviceIds[0],
    }));
    relationshipsInserts.push(knex('knowledge_answer_facilitys').insert({
      answer_id: obj.answerIds[0],
      facility_id: obj.facilityIds[0],
    }));
    return Promise.all(relationshipsInserts).then((data) => {
      return finishSeed(obj);
    });
  };

  const finishSeed = (obj) => {
    return logger.info(obj);
  };

  const startSeed = () => {
    return categorySeed({});
  };

  return startSeed();
};