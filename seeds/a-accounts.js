import { logger } from '../api/logger';

exports.seed = (knex, Promise) => {
  // Deletes ALL existing entries
  return new Promise.all([
    // Clear relationships between orgs and other entities
    knex('organizations_integrations').del(),
    knex('narrative_sessions').del(),
  ])
  .then(() => {
    // Clearing knowledge entities in a particular order because of relationships
    return knex('services').del().then(() => {
      return knex('places').del();
    });
  })
  .then(() => {
    // Clearing organizations first CASCADE deletes representatives with associated foreign keys
    return Promise.all([
      knex('knowledge_questions').del(),
      knex('knowledge_answers').del(),
      knex('representatives').del(),
    ]);
  })
  .then(() => {
    // Then we clear unassociated representatives
    return Promise.all([
      knex('organizations').del(),
      knex('constituents').del(),
      knex('knowledge_categorys').del(),
    ]);
  })
  .then(() => {
    return Promise.all([
      knex('addresss').del(),
    ]);
  })
  .then(() => {
    // Seed Locations
    const seedJerseyCity = knex('addresss').insert({
      location: 'SRID=4326;POINT(40.72815749999999 -74.0776417)',
      name: 'Jersey City, NJ, USA',
      city: 'Jersey City',
      state: 'New Jersey',
      region: 'Hudson County',
      country: 'United States',
      country_code: 'US',
    }, 'id');
    const seedNewBrunswick = knex('addresss').insert({
      location: 'SRID=4326;POINT(40.4862157 -74.4518188)',
      name: 'New Brunswick, NJ, USA',
      city: 'New Brunswick',
      state: 'New Jersey',
      region: 'Middlesex County',
      country: 'United States',
      country_code: 'US',
    }, 'id');
    const seedHighlandPark = knex('addresss').insert({
      location: 'SRID=4326;POINT(40.4973 -74.4242)',
      name: 'Highland Park, Middlesex County, New Jersey, United States',
      city: 'Highland Park',
      state: 'New Jersey',
      region: 'Middlesex County',
      country: 'United States',
      country_code: 'US',
    }, 'id');
    const seedSanFrancisco = knex('addresss').insert({
      location: 'SRID=4326;POINT(37.7749295 -122.4194155)',
      name: 'SF, CA, USA',
      city: 'SF',
      state: 'California',
      region: 'SF',
      country: 'United States',
      country_code: 'US',
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
        url: 'http://www.cityofjerseycity.com',
      }, 'id').then((ids) => {
        return knex('addresss_entity_associations').insert({
          organization_id: ids[0],
          address_id: passedObj.locationIds.jerseyCityLocation,
        }).then(() => ids[0]);
      }),
      knex('organizations').insert({
        name: 'City of New Brunswick',
        type: 'government',
        url: 'http://www.thecityofnewbrunswick.org',
      }, 'id').then((ids) => {
        return knex('addresss_entity_associations').insert({
          organization_id: ids[0],
          address_id: passedObj.locationIds.newBrunswickLocation,
        }).then(() => ids[0]);
      }),
      knex('organizations').insert({
        name: 'Highland Park',
        type: 'government',
        url: 'www.hpboro.com/',
      }, 'id').then((ids) => {
        return knex('addresss_entity_associations').insert({
          organization_id: ids[0],
          address_id: passedObj.locationIds.highlandParkLocation,
        }).then(() => ids[0]);
      }),
      knex('organizations').insert({
        name: 'San Francisco',
        type: 'government',
        url: 'http://sfgov.org/',
      }, 'id').then((ids) => {
        return knex('addresss_entity_associations').insert({
          organization_id: ids[0],
          address_id: passedObj.locationIds.sanFranciscoLocation,
        }).then(() => ids[0]);
      }),
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
