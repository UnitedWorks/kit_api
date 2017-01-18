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
      organization_id: obj.organizationIds.jerseyCity,
    }, 'id'));
    facilitiesInserts.push(knex('knowledge_facilitys').insert({
      name: 'Midtown Precinct North',
      description: 'Your classic neighborhood police station downtown',
      type_id: 22,
      category_id: 8,
      schedule_id: obj.scheduleIds[1],
      location_id: obj.locationIds[1],
      organization_id: obj.organizationIds.jerseyCity,
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
      organization_id: obj.organizationIds.jerseyCity,
    }, 'id'));
    servicesInserts.push(knex('knowledge_services').insert({
      name: 'Scared straight',
      description: 'A program that everyone thought was a good idea',
      facility_id: obj.facilityIds[0],
      category_id: 8,
      schedule_id: obj.scheduleIds[4],
      organization_id: obj.organizationIds.jerseyCity,
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
      organization_id: obj.organizationIds.jerseyCity,
    }, 'id'));
    eventsInserts.push(knex('knowledge_events').insert({
      name: 'Middleschool PS111 visits the jail',
      description: 'Get it out of their system?',
      facility_id: obj.facilityIds[1],
      schedule_id: obj.scheduleIds[5],
      service_id: obj.serviceIds[1],
      organization_id: obj.organizationIds.jerseyCity,
    }, 'id'));
    return Promise.all(eventsInserts).then((data) => {
      obj['eventIds'] = [].concat(...data);
      return answerSeed(obj);
    });
  };

  const answerSeed = (obj) => {
    const answersInserts = [];
    answersInserts.push(knex('knowledge_answers').insert({
      label: 'employment-job-training',
      question: 'Where can I get basic job training?',
      answer: 'The city provides training for jobs around the year. Be sure to visit a job center or check our website',
      category_id: obj.categoryIds[3],
      organization_id: obj.organizationIds.jerseyCity,
      url: 'http://www1.nyc.gov/nyc-resources/service/2984/nyc-job-training-guide',
    }, 'id'));
    answersInserts.push(knex('knowledge_answers').insert({
      label: 'smallTalk-food',
      question: 'What is the best food in the city?',
      answer: 'Fat sandwiches!',
      organization_id: obj.organizationIds.newBrunswick,
    }, 'id'));
    // Sanitation - Garbage Schedule
    answersInserts.push(knex('knowledge_answers').insert({
      label: 'sanitation-garbage-schedule',
      question: 'What day is trash pickup?',
      answer: 'Trash alternates based on districts and address. Please refer to our schedule.',
      category_id: obj.categoryIds[1],
      organization_id: obj.organizationIds.jerseyCity,
      url: 'http://www.cityofjerseycity.com/public_works.aspx?id=878',
    }, 'id'));
    answersInserts.push(knex('knowledge_answers').insert({
      label: 'sanitation-garbage-schedule',
      question: 'What day is trash pickup?',
      answer: 'Trash pickup is every Wednesday, starting at 5:00 AM',
      category_id: obj.categoryIds[1],
      organization_id: obj.organizationIds.newBrunswick,
      url: 'http://thecityofnewbrunswick.org/public-works/trash-and-recycling-info/',
    }, 'id'));
    answersInserts.push(knex('knowledge_answers').insert({
      label: 'sanitation-garbage-schedule',
      question: 'What day is trash pickup?',
      answer: 'Trash pickup is every Friday',
      category_id: obj.categoryIds[1],
      organization_id: obj.organizationIds.hanover,
      url: 'http://www.hanovertownship.org/garbage.html',
    }, 'id'));
    // Sanitation - Recycling Schedule
    answersInserts.push(knex('knowledge_answers').insert({
      label: 'sanitation-recycling-schedule',
      question: 'Which day is recycling?',
      answer: 'Recycling alternates based on districts and address. Please refer to our schedule.',
      category_id: obj.categoryIds[1],
      organization_id: obj.organizationIds.jerseyCity,
      url: 'http://www.cityofjerseycity.com/uploadedFiles/Waste%20Disposal%20and%20Recycling%20Rules%202016.pdf',
    }, 'id'));
    answersInserts.push(knex('knowledge_answers').insert({
      label: 'sanitation-recycling-schedule',
      question: 'Which day is recycling?',
      answer: 'Recycling pickup is every Wednesday, starting at 5:00 AM',
      category_id: obj.categoryIds[1],
      organization_id: obj.organizationIds.newBrunswick,
      url: 'http://thecityofnewbrunswick.org/blog/2015/12/16/2016-trash-and-recycling-schedules-now-available/',
    }, 'id'));
    answersInserts.push(knex('knowledge_answers').insert({
      label: 'sanitation-recycling-schedule',
      question: 'Which day is recycling?',
      answer: 'Recycling pickup is every Friday',
      category_id: obj.categoryIds[1],
      organization_id: obj.organizationIds.hanover,
      url: 'http://www.hanovertownship.com/Portals/1/DPW/2017%20recycling%20schedule.pdf',
    }, 'id'));
    // Sanitation - Compost
    answersInserts.push(knex('knowledge_answers').insert({
      label: 'sanitation-compost',
      question: 'When do you collect compost?',
      answer: 'Composting is collected in select locations. You can find more info on our partner website.',
      category_id: obj.categoryIds[1],
      organization_id: obj.organizationIds.jerseyCity,
      url: 'http://sustainablejc.org/wordpress/projects/community-composting/',
    }, 'id'));
    // Sanitation - Bulk
    answersInserts.push(knex('knowledge_answers').insert({
      label: 'sanitation-bulk-pickup',
      question: 'How can I request bulk item pickup?',
      answer: 'To schedule bulk pickup with the Department of Public Works, simply call 201-547-4400',
      category_id: obj.categoryIds[1],
      organization_id: obj.organizationIds.jerseyCity,
    }, 'id'));
    // Sanitation - Electronics
    answersInserts.push(knex('knowledge_answers').insert({
      label: 'sanitation-electronics-disposal',
      question: 'Where can I dispose of electronics?',
      answer: 'Electronics disposal is handled by the county at this time. Please refer to their websites and locations.',
      category_id: obj.categoryIds[1],
      organization_id: obj.organizationIds.jerseyCity,
      url: 'http://www.hcia.org/index.php?option=com_content&view=article&id=31&Itemid=34',
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
    const getNewBrunswick = knex.select().where('name', 'City of New Brunswick').from('organizations');
    const getJerseyCity = knex.select().where('name', 'Jersey City').from('organizations');
    const getHanover = knex.select().where('name', 'Hanover Township').from('organizations');
    const getSanFrancisco = knex.select().where('name', 'San Francisco').from('organizations');
    return new Promise.join(getNewBrunswick, getJerseyCity, getHanover, getSanFrancisco,
      (newBrunswick, jerseyCity, hanover, sanFrancisco) => {
        return {
          newBrunswick: newBrunswick[0].id,
          jerseyCity: jerseyCity[0].id,
          hanover: hanover[0].id,
          sanFrancisco: sanFrancisco[0].id,
        };
    }).then((orgs) => {
      return categorySeed({
        organizationIds: orgs,
      });
    });
  };

  return startSeed();
};
