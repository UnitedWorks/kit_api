import { logger } from '../api/logger';

exports.seed = function(knex, Promise) {

  return new Promise((resolve) => {
    // Setup
    return Promise.all([
      knex('narrative_modules').del(),
    ]).then(() => {
      resolve({});
    });
  }).then((passedObj) => {
    const idsObj = passedObj;
    // Add Modules - FAQ, Requests, Unhoused Services
    const faqModule = knex('narrative_modules').insert({
      name: 'Base Questions',
      description: 'A collection of the most frequently asked questions.',
      abbreviation: 'base-faq',
    }, 'id').then((ids) => { return ids[0]; });
    const requestModule = knex('narrative_modules').insert({
      name: 'Base Requests',
      description: 'A collection of the most frequent 311 requests.',
      abbreviation: 'base-requests',
    }, 'id').then((ids) => { return ids[0] });
    const unhousedModule = knex('narrative_modules').insert({
      name: 'Unhoused Support',
      description: 'Support for constituents at risk of becoming or already unhoused.',
      abbreviation: 'unhoused',
    }, 'id').then((ids) => { return ids[0] });
    return Promise.join(faqModule, requestModule, unhousedModule,
      (faqId, requestId, unhousedId) => {
        idsObj.moduleIds = {
          faq: faqId,
          request: requestId,
          unhoused: unhousedId,
        };
        return idsObj;
    });
  }).then((passedObj) => {
    const idsObj = passedObj;
    // Add Intents - Observed Holidays, Trash Schedule, Report Pothole, Food pantries
    const holidayIntent;
    const trashIntent;
    const potholeIntent;
    const foodPantryIntent;

  }).then((passedObj) => {
    const idsObj = passedObj;
    // Add Responses - Responses to each intent for Jersey City, New Brunswick, and San Francisco
    const responseInserts = [];
  }).then((passedObj) => {
    const idsObj = passedObj;
    // Setup Module Configurations
  });
};
