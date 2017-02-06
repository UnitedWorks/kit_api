import { logger } from '../api/logger';

exports.seed = function(knex, Promise) {

  return new Promise((resolve) => {
    // Setup
    return Promise.all([
      knex('organizations_integrations').del(),
      knex('integrations').del(),
      knex('narrative_sessions').del(),
    ]).then(() => {
      resolve({});
    });
  }).then((passedObj) => {
    const idsObj = passedObj;
    // Add Ask Darcel Source
    const askDarcelInsert = knex('integrations').insert({
      name: 'AskDarcel',
      type: 'info',
      label: 'askDarcel',
      description: 'A collection of service information for the unhoused.',
      url: 'https://askdarcel.org'
    }, 'id').then(ids => ids[0]);
    const sfSelect = knex.select().where('name', 'San Francisco').from('organizations').then((rows) => {
      return rows[0].id
    });
    return Promise.join(askDarcelInsert, sfSelect, (askDarcelId, sfId) => {
      idsObj.sourceIds = {
        askDarcel: askDarcelId,
      };
      idsObj.organizationIds = {
        sanFrancisco: sfId,
      };
      return idsObj;
    });
  }).then((passedObj) => {
    // Add Organization/Source Relations
    const idsObj = passedObj;
    const sourceRelationInserts = [];
    sourceRelationInserts.push(knex('organizations_integrations').insert({
      organization_id: idsObj.organizationIds.sanFrancisco,
      integration_id: idsObj.sourceIds.askDarcel,
    }));
    return Promise.all(sourceRelationInserts).then(() => {
      return passedObj;
    });
  }).then(logger.info);
};
