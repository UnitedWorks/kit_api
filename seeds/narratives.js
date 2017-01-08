import { logger } from '../api/logger';

exports.seed = function(knex, Promise) {

  return new Promise((resolve) => {
    // Setup
    return Promise.all([
      knex('narrative_sources').del(),
      knex('narrative_stores').del(),
      knex('organizations_narrative_sources').del(),
    ]).then(() => {
      resolve({});
    });
  }).then((passedObj) => {
    const idsObj = passedObj;
    // Add Sources
    const askDarcelInsert = knex('narrative_sources').insert({
      name: 'AskDarcel',
      description: 'A collection of service information for the unhoused.',
      label: 'askDarcel',
    }, 'id').then((ids) => { return ids[0] });
    const organizationSelect = knex.select().from('organizations').then((rows) => {
      return rows.map((row) => {
        return row.id;
      });
    });
    return Promise.join(askDarcelInsert, organizationSelect, (askDarcelId, organizationIds) => {
      idsObj.sourceIds = [askDarcelId];
      idsObj.organizationIds = organizationIds;
      return idsObj;
    });
  }).then((passedObj) => {
    // Add Organization/Source Relations
    const idsObj = passedObj;
    const sourceRelationInserts = []
    idsObj.organizationIds.forEach((orgId) => {
      idsObj.sourceIds.forEach((sourceId) => {
        sourceRelationInserts.push(knex('organizations_narrative_sources').insert({
          organization_id: orgId,
          narrative_source_id: sourceId,
        }));
      });
    });
    return Promise.all(sourceRelationInserts).then(() => {
      return passedObj;
    });
  }).then((passedObj) => {
    return logger.info(passedObj);
  });
};
