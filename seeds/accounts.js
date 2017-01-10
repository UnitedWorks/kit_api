import { logger } from '../api/logger';

exports.seed = (knex, Promise) => {
  // Deletes ALL existing entries
  return new Promise.all([
    // Clear relationships between orgs and other entities
    knex.select().table('organizations_constituents').del(),
    knex.select().table('organizations_narrative_sources').del(),
    knex.select().table('knowledge_answers_knowledge_events').del(),
    knex.select().table('knowledge_answers_knowledge_services').del(),
    knex.select().table('knowledge_answers_knowledge_facilitys').del(),
  ])
  .then(() => {
      // Clearing knowledge entities in a particular order because of relationships
      return knex.select().table('knowledge_events').del().then(() => {
        return knex.select().table('knowledge_services').del().then(() => {
          return knex.select().table('knowledge_facilitys').del();
        });
      });
  })
  .then(() => {
      // Clearing organizations first CASCADE deletes representatives with associated foreign keys
      return Promise.all([
        knex.select().table('knowledge_answers').del(),
        knex.select().table('organizations').del(),
      ]);
  })
  .then(() => {
      // Then we clear unassociated representatives
      return Promise.all([
        knex.select().table('locations').del(),
        knex.select().table('schedules').del(),
        knex.select().table('representatives').del(),
        knex.select().table('constituents').del(),
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
    return Promise.join(seedJerseyCity, seedNewBrunswick, seedHanoverTownship, (jC, nB, hT) => {
      return {
        locationIds: {
          jerseyCityLocation: jC[0],
          newBrunswickLocation: nB[0],
          hanoverTownshipLocation: hT[0],
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
        website: 'http://www.cityofjerseycity.com',
        location_id: passedObj.locationIds.jerseyCityLocation,
      }, 'id').then((ids) => { return ids[0]; }),
      knex('organizations').insert({
        name: 'City of New Brunswick',
        category: 'public',
        type: 'admin',
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
        name: 'Billy Bob',
        email: 'bills@bob.com',
        password: '123456',
        organization_id: idsObj.organizationIds[0],
      }, 'id'),
      knex('representatives').insert({
        name: 'Debbie Debs',
        email: 'debs@debbie.com',
        password: '123456',
        organization_id: idsObj.organizationIds[1],
      }, 'id'),
    ]).then((ids) => {
      idsObj.representativeIds = [].concat(...ids);
      return idsObj;
    });
  })
  .then((passedObj) => {
    // Add Constituents
    const idsObj = passedObj;
    const constituentInserts = [];
    constituentInserts.push(knex('constituents').insert({
      email: 'x@markthemark.com',
      phone: '9737239567',
      facebook_id: 1,
      twitter_handle: 'youmustfight',
    }, 'id'));
    constituentInserts.push(knex('constituents').insert({
      email: 'markhansen09@gmail.com',
      phone: '9737239567',
      facebook_id: 2,
      twitter_handle: 'unitedworks',
    }, 'id'));
    return Promise.all(constituentInserts).then((ids) => {
      idsObj.constituentIds = [].concat(...ids);
      return idsObj;
    });
  })
  .then((passedObj) => {
    // Add Relations
    return Promise.all([
      knex('organizations_constituents').insert({
        organization_id: passedObj.organizationIds[0],
        constituent_id: passedObj.constituentIds[0],
      }),
      knex('organizations_constituents').insert({
        organization_id: passedObj.organizationIds[1],
        constituent_id: passedObj.constituentIds[1],
      }),
    ]).then(() => {
      return passedObj;
    });
  })
  .then((passedObj) => {
    logger.info(passedObj);
  });
};
