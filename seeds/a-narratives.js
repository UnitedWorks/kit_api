import { logger } from '../api/logger';

exports.seed = function(knex, Promise) {

  return new Promise((resolve) => {
    // Setup
    return Promise.all([
      knex('organizations_narrative_sources').del(),
      knex('narrative_sources').del(),
      knex('narrative_sessions').del(),
    ]).then(() => {
      resolve({});
    });
  }).then((passedObj) => {
    const idsObj = passedObj;
    // Add Ask Darcel Source
    const askDarcelInsert = knex('narrative_sources').insert({
      name: 'AskDarcel',
      description: 'A collection of service information for the unhoused.',
      label: 'askDarcel',
    }, 'id').then((ids) => { return ids[0] });
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
    const sourceRelationInserts = []
    sourceRelationInserts.push(knex('organizations_narrative_sources').insert({
      organization_id: idsObj.organizationIds.sanFrancisco,
      narrative_source_id: idsObj.sourceIds.askDarcel,
    }));
    return Promise.all(sourceRelationInserts).then(() => {
      return passedObj;
    });
  }).then((passedObj) => {
    return logger.info(passedObj);
  });
};