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
      type: 'knowledge',
      label: 'askDarcel',
      description: 'A collection of service information for the unhoused.',
      url: 'https://askdarcel.org',
    }, 'id').then(ids => ids[0]);
    const voteFoundationInsert = knex('integrations').insert({
      name: 'US Vote Foundation',
      type: 'knowledge',
      label: 'voteFoundation',
      description: 'Voter registraiton information.',
      url: 'https://www.usvotefoundation.org',
    });
    const benefitKitchenInsert = knex('integrations').insert({
      name: 'Benefit Kitchen',
      type: 'knowledge',
      label: 'benefitKitchen',
      description: 'Benefit calculators for state/federal programs.',
      url: 'http://benefitkitchen.com',
    });
    const seeClickFixInsert = knex('integrations').insert({
      name: 'See Click Fix',
      type: 'cases',
      label: 'seeClickFix',
      description: 'Request and case management system',
      url: 'https://seeclickfix.com',
    });
    const staeInsert = knex('integrations').insert({
      name: 'Stae',
      type: 'knowledge',
      label: 'stae',
      description: 'Realtime Data Streams',
      url: 'https://seeclickfix.com',
    });
    const sfSelect = knex.select().where('name', 'San Francisco').from('organizations')
      .then(rows => rows[0].id);
    return Promise.join(
      askDarcelInsert, sfSelect, voteFoundationInsert, benefitKitchenInsert, seeClickFixInsert, staeInsert
      (askDarcelId, sfId) => {
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
