// Setup
require('babel-core/register');
require('babel-polyfill');
require('../api/env').setup();
const knex = require('../api/orm').knex;

const updateOperations = [{
  label: 'public_safety_law.restraining_order',
  question: 'Where and how can I get a restraining order?',
}, {
  label: 'property_buildings_homes.blight',
  question: 'Where do I report blight conditions or unkempt lawns/property?',
}, {
  label: 'property_buildings_homes.fences',
  question: 'What rules and permits exist regarding residential fences?',
}, {
  label: 'property_buildings_homes.responsibility.heat',
  question: 'Is heating supposed to be provided by a landlord?',
}, {
  label: 'environment_sanitation.recycling.bins',
  question: 'Do I need special bins for recycling?',
}, {
  label: 'property_buildings_homes.eviction',
  question: 'I received an eviction. what should I do?',
}, {
  label: 'environment_sanitation.disposal.leaf',
  question: 'How do I get rid of my leaves?',
}, {
  label: 'environment_sanitation.tree.pruning',
  question: 'I think a tree needs pruning',
}, {
  label: 'business_finance.business.loans',
  question: 'Where can I find money or loans to start a business?',
}, {
  label: 'business_finance.permit_license_permission.business',
  question: 'How do I get a business or merchants license?',
}, {
  label: 'education_employment.employment.search',
  question: 'How do I know what jobs are available?',
}, {
  label: 'property_buildings_homes.district_zoning.flood',
  question: 'How can I find out if my property in a flood zone?',
}, {
  label: 'government_civil_services.identification.senior_citizen_id',
  question: 'What is the ID program for senior citizens?',
}, {
  label: 'environment_sanitation.tree.planting',
  question: 'I want a tree planted. Anything I need to do?',
}, {
  label: 'environment_sanitation.recycling',
  question: 'Recycle',
}].map(({ label, question }) => {
  return knex('knowledge_questions')
    .where({ label })
    .update({ question, updated_at: knex.raw('now()') })
    .then(r => r);
});

Promise.all(updateOperations).then((results) => {
  console.log(results);
}).catch((error) => {
  console.log(error);
});
