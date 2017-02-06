import { logger } from '../api/logger';

exports.seed = (knex, Promise) => {
  // Deletes ALL existing entries
  return new Promise.all([
    // Clear relationships between orgs and other entities
    knex('organizations_constituents').del(),
    knex('organizations_integrations').del(),
    knex('narrative_sessions').del(),
    knex('knowledge_answers_knowledge_events').del(),
    knex('knowledge_answers_knowledge_services').del(),
    knex('knowledge_answers_knowledge_facilitys').del(),
    knex('case_category_representative_assignments').del(),
    knex('organizations_cases').del(),
    knex('representatives_cases').del(),
  ])
  .then(() => {
    // Clearing knowledge entities in a particular order because of relationships
    return knex('knowledge_events').del().then(() => {
      return knex('knowledge_services').del().then(() => {
        return knex('knowledge_facilitys').del().then(() => {
          return knex('knowledge_questions_organizations_knowledge_answers').del();
        });
      });
    });
  })
  .then(() => {
    // Clearing organizations first CASCADE deletes representatives with associated foreign keys
    return Promise.all([
      knex('knowledge_questions').del(),
      knex('knowledge_answers').del(),
      knex('representatives').del(),
      knex('cases').del(),
    ]);
  })
  .then(() => {
    // Then we clear unassociated representatives
    return Promise.all([
      knex('schedules').del(),
      knex('organizations').del(),
      knex('constituents').del(),
      knex('knowledge_categorys').del(),
      knex('integrations_locations').del(),
    ]);
  })
  .then(() => {
    return Promise.all([
      knex('locations').del(),
    ]);
  })
  .then(() => {
    // Seed Locations
    const seedJerseyCity = knex('locations').insert({
      latitude: 40.72815749999999,
      longitude: -74.0776417,
      formatted_address: 'Jersey City, NJ, USA',
      city: 'Jersey City',
      country: 'United States',
      country_code: 'US',
      zipcode: '08901',
      administrative_levels: {
        level2long: 'Hudson County',
        level2short: 'Hudson County',
        level1long: 'New Jersey',
        level1short: 'NJ',
      },
    }, 'id');
    const seedNewBrunswick = knex('locations').insert({
      latitude: 40.4862157,
      longitude: -74.4518188,
      formatted_address: 'New Brunswick, NJ, USA',
      city: 'New Brunswick',
      country: 'United States',
      country_code: 'US',
      zipcode: '08901',
      administrative_levels: {
        level2long: 'Middlesex County',
        level2short: 'Middlesex County',
        level1long: 'New Jersey',
        level1short: 'NJ',
      },
    }, 'id');
    const seedHanoverTownship = knex('locations').insert({
      latitude: 40.828898,
      longitude: -74.449686,
      formatted_address: 'Hanover, NJ 07927, USA',
      city: 'Hanover',
      country: 'United States',
      country_code: 'US',
      zipcode: '07927',
      administrative_levels: {
        level2long: 'Morris County',
        level2short: 'Morris County',
        level1long: 'New Jersey',
        level1short: 'NJ',
      },
    }, 'id');
    const seedSanFrancisco = knex('locations').insert({
      latitude: 37.7749295,
      longitude: -122.4194155,
      formatted_address: 'San Francisco, CA, USA',
      city: 'San Francisco',
      country: 'United States',
      country_code: 'US',
      administrative_levels: {
        level2long: 'San Francisco County',
        level2short: 'San Francisco County',
        level1long: 'California',
        level1short: 'CA',
      },
    }, 'id');
    return Promise.join(seedJerseyCity, seedNewBrunswick, seedHanoverTownship, seedSanFrancisco, (jC, nB, hT, sF) => {
      return {
        locationIds: {
          jerseyCityLocation: jC[0],
          newBrunswickLocation: nB[0],
          hanoverTownshipLocation: hT[0],
          sanFranciscoLocation: sF[0],
        },
      };
    });
  })
  .then((passedObj) => {
    // Seed Organizations
    return Promise.all([
      knex('organizations').insert({
        name: 'Jersey City',
        category: 'public',
        type: 'admin',
        activated: true,
        website: 'http://www.cityofjerseycity.com',
        location_id: passedObj.locationIds.jerseyCityLocation,
      }, 'id').then((ids) => { return ids[0]; }),
      knex('organizations').insert({
        name: 'City of New Brunswick',
        category: 'public',
        type: 'admin',
        activated: true,
        website: 'http://www.thecityofnewbrunswick.org',
        location_id: passedObj.locationIds.newBrunswickLocation,
      }, 'id').then((ids) => { return ids[0] }),
      knex('organizations').insert({
        name: 'Hanover Township',
        category: 'public',
        type: 'admin',
        website: 'http://www.hanovertownship.com/',
        location_id: passedObj.locationIds.hanoverTownshipLocation,
      }, 'id').then((ids) => { return ids[0] }),
      knex('organizations').insert({
        name: 'San Francisco',
        category: 'public',
        type: 'admin',
        activated: true,
        website: 'http://sfgov.org/',
        location_id: passedObj.locationIds.sanFranciscoLocation,
      }, 'id').then((ids) => { return ids[0] }),
    ]).then((ids) => {
      return Object.assign(passedObj, {
        organizationIds: [].concat(...ids),
      });
    });
  })
  .then((passedObj) => {
    const idsObj = passedObj;
    // Seed Representatives
    return Promise.all([
      knex('representatives').insert({
        name: 'Mark Hansen',
        email: 'markhansen09@gmail.com',
        organization_id: idsObj.organizationIds[1],
      }, 'id'),
    ]).then((ids) => {
      idsObj.representativeIds = [].concat(...ids);
      return idsObj;
    });
  })
  .then((passedObj) => {
    logger.info(passedObj);
  });
};
