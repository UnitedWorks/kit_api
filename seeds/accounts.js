import { logger } from '../api/logger';

exports.seed = (knex, Promise) => {
  // Deletes ALL existing entries
  return knex.select().table('organizations').del()
    .then(() => {
      // Clearing organizations first CASCADE deletes representatives with associated foreign keys
      // Then we clear unassociated representatives
      return Promise.all([
        knex.select().table('representatives').del(),
        knex.select().table('constituents').del()
      ]);
    })
    .then(() => {
      // Seed Organizations
      return Promise.all([
        knex('organizations').insert({
          name: 'Jersey City',
          website: 'www.cityofjerseycity.com',
        }, 'id').then((ids) => { return ids[0]; }),
        knex('organizations').insert({
          name: 'City of New Brunswick',
          website: 'www.thecityofnewbrunswick.org',
        }, 'id').then((ids) => { return ids[0] }),
      ]).then((ids) => {
        return {
          organizationIds: [].concat(...ids),
        };
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
        logger.info(passedObj);
        return passedObj;
      });
    })
    .then((passedObj) => {
      logger.info(passedObj);
    });
};
