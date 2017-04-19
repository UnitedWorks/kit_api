import { logger } from '../api/logger';
import { PRIMARY_CATEGORIES } from '../api/constants/cases';

exports.seed = function(knex, Promise) {
  return Promise.all([
    knex('case_categorys').del(),
  ])
  .then(() => {
    return Promise.all([
      knex('cases').del(),
    ]);
  })
  .then(() => {
    const categoryInserts = [];
    PRIMARY_CATEGORIES.forEach((label) => {
      categoryInserts.push(knex('case_categorys').insert({ label }));
    });
    return Promise.all(categoryInserts);
  })
  .then((passedObj) => {
    logger.info(passedObj);
  });
};
