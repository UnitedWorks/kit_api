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
    for (let i = 0; i < 4; i += 1) {
      locationInserts.push(knex('locations').insert({}, 'id'));
    }
    return Promise.all(locationInserts).then((data) => {
      obj['locationIds'] = [].concat(...data);
      return scheduleSeed(obj);
    });
  };

  const scheduleSeed = (obj) => {
    const scheduleInserts = [];
    for (let i = 0; i < 6; i += 1) {
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
      type_id: 21,
      category_id: 4,
      schedule_id: obj.scheduleIds[0], // Refers to hours of operation
      location_id: obj.locationIds[0], // Geolocation of facility
      organization_id: obj.organizationIds[0],
    }, 'id'));
    facilitiesInserts.push(knex('knowledge_facilitys').insert({
      name: 'Midtown Precinct North',
      description: 'Your classic neighborhood police station in Manhattan',
      type_id: 22,
      category_id: 8,
      schedule_id: obj.scheduleIds[1],
      location_id: obj.locationIds[1],
      organization_id: obj.organizationIds[0],
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
      category_id: 4,
      schedule_id: obj.scheduleIds[2], // Refers to the schedule of the class
      organization_id: obj.organizationIds[0],
    }, 'id'));
    servicesInserts.push(knex('knowledge_services').insert({
      name: 'Scared straight',
      description: 'A program that everyone thought was a good idea',
      facility_id: obj.facilityIds[0],
      category_id: 8,
      schedule_id: obj.scheduleIds[4],
      organization_id: obj.organizationIds[0],
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
      organization_id: obj.organizationIds[0],
    }, 'id'));
    eventsInserts.push(knex('knowledge_events').insert({
      name: 'Middleschool PS111 visits the jail',
      description: 'Get it out of their system?',
      facility_id: obj.facilityIds[1],
      schedule_id: obj.scheduleIds[5],
      service_id: obj.serviceIds[1],
      organization_id: obj.organizationIds[0],
    }, 'id'));
    return Promise.all(eventsInserts).then((data) => {
      obj['eventIds'] = [].concat(...data);
      return answerSeed(obj);
    });
  };

  const answerSeed = (obj) => {
    const answersInserts = [];
    answersInserts.push(knex('knowledge_answers').insert({
      label: 'faq-education-jobTraining',
      question: 'Where can I get basic job training?',
      answer: 'The city provides training for jobs around the year. Be sure to visit a job center or check our website',
      category_id: obj.categoryIds[0],
      organization_id: obj.organizationIds[0],
      url: 'http://www1.nyc.gov/nyc-resources/service/2984/nyc-job-training-guide',
    }, 'id'));
    answersInserts.push(knex('knowledge_answers').insert({
      label: 'smallTalk-food',
      question: 'What is the best food in the city?',
      answer: 'Fat sandwiches!',
      category_id: obj.categoryIds[0],
      organization_id: obj.organizationIds[1],
    }, 'id'));
    answersInserts.push(knex('knowledge_answers').insert({
      label: 'sanitation-garbage-schedule',
      question: 'What day is trash pickup?',
      answer: 'Trash alternates based on districts and address. Please refer to our schedule.',
      category_id: obj.categoryIds[3],
      organization_id: obj.organizationIds[0],
      url: 'http://www.cityofjerseycity.com/public_works.aspx?id=878',
    }, 'id'));
    answersInserts.push(knex('knowledge_answers').insert({
      label: 'sanitation-garbage-schedule',
      question: 'What day is trash pickup?',
      answer: 'Trash pickup is every Wednesday, starting at 5:00 AM',
      category_id: obj.categoryIds[3],
      organization_id: obj.organizationIds[1],
      url: 'http://thecityofnewbrunswick.org/public-works/trash-and-recycling-info/',
    }, 'id'));
    answersInserts.push(knex('knowledge_answers').insert({
      label: 'sanitation-garbage-schedule',
      question: 'What day is trash pickup?',
      answer: 'Trash pickup is every Friday',
      category_id: obj.categoryIds[3],
      organization_id: obj.organizationIds[2],
      url: 'http://www.hanovertownship.org/garbage.html',
    }, 'id'));
    return Promise.all(answersInserts).then((data) => {
      obj['answerIds'] = [].concat(...data);
      return relationshipSeed(obj);
    });
  };

  const relationshipSeed = (obj) => {
    const relationshipsInserts = [];
    relationshipsInserts.push(knex('knowledge_answers_knowledge_events').insert({
      knowledge_answer_id: obj.answerIds[0],
      knowledge_event_id: obj.eventIds[0],
    }));
    relationshipsInserts.push(knex('knowledge_answers_knowledge_services').insert({
      knowledge_answer_id: obj.answerIds[0],
      knowledge_service_id: obj.serviceIds[0],
    }));
    relationshipsInserts.push(knex('knowledge_answers_knowledge_facilitys').insert({
      knowledge_answer_id: obj.answerIds[0],
      knowledge_facility_id: obj.facilityIds[0],
    }));
    return Promise.all(relationshipsInserts).then((data) => {
      return finishSeed(obj);
    });
  };

  const finishSeed = (obj) => {
    return logger.info(obj);
  };

  const startSeed = () => {
    return new Promise((resolve, reject) => {
      knex.select().from('organizations').then((rows) => {
        resolve(rows.map((row) => {
          return row.id;
        }));
      });
    }).then((orgIds) => {
      return categorySeed({
        organizationIds: orgIds,
      });
    });
  };

  return startSeed();
};
