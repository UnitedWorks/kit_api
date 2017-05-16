import { logger } from '../api/logger';

exports.seed = (knex, Promise) => {
  // Deletes ALL existing entries
  return new Promise.all([
    // Clear relationships between orgs and other entities
    knex('organizations_integrations').del(),
    knex('narrative_sessions').del(),
    knex('organizations_cases').del(),
  ])
  .then(() => {
    // Clearing knowledge entities in a particular order because of relationships
    return knex('knowledge_events').del().then(() => {
      return knex('knowledge_services').del().then(() => {
        return knex('knowledge_facilitys').del();
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
      lat: 40.72815749999999,
      lon: -74.0776417,
      display_name: 'Jersey City, NJ, USA',
      address: {
        city: 'Jersey City',
        state: 'New Jersey',
        county: 'Hudson County',
        country: 'United States of America',
        country_code: 'us',
      },
    }, 'id');
    const seedNewBrunswick = knex('locations').insert({
      lat: 40.4862157,
      lon: -74.4518188,
      display_name: 'New Brunswick, NJ, USA',
      address: {
        city: 'New Brunswick',
        state: 'New Jersey',
        county: 'Middlesex County',
        country: 'United States of America',
        country_code: 'us',
      },
    }, 'id');
    const seedHighlandPark = knex('locations').insert({
      lat: 40.828898,
      lon: -74.449686,
      display_name: 'Highland Park, Middlesex County, New Jersey, United States of America',
      address: {
        city: 'Highland Park',
        state: 'New Jersey',
        county: 'Middlesex County',
        country: 'United States of America',
        country_code: 'us',
      },
    }, 'id');
    const seedSanFrancisco = knex('locations').insert({
      lat: 37.7749295,
      lon: -122.4194155,
      display_name: 'SF, CA, USA',
      address: {
        city: 'SF',
        state: 'California',
        county: 'SF',
        country: 'United States of America',
        country_code: 'us',
      },
    }, 'id');
    return Promise.join(seedJerseyCity, seedNewBrunswick, seedHighlandPark, seedSanFrancisco, (jC, nB, hT, sF) => {
      return {
        locationIds: {
          jerseyCityLocation: jC[0],
          newBrunswickLocation: nB[0],
          highlandParkLocation: hT[0],
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
        type: 'government',
        activated: true,
        website: 'http://www.cityofjerseycity.com',
        location_id: passedObj.locationIds.jerseyCityLocation,
      }, 'id').then((ids) => { return ids[0]; }),
      knex('organizations').insert({
        name: 'City of New Brunswick',
        type: 'government',
        activated: true,
        website: 'http://www.thecityofnewbrunswick.org',
        location_id: passedObj.locationIds.newBrunswickLocation,
      }, 'id').then((ids) => { return ids[0] }),
      knex('organizations').insert({
        name: 'Highland Park',
        type: 'government',
        website: 'www.hpboro.com/',
        location_id: passedObj.locationIds.highlandParkLocation,
      }, 'id').then((ids) => { return ids[0] }),
      knex('organizations').insert({
        name: 'San Francisco',
        type: 'government',
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
        organization_id: idsObj.organizationIds[2],
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
