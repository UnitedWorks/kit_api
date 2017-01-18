import { logger } from '../api/logger';
import { PRIMARY_CATEGORIES } from '../api/constants/case-categories';

exports.seed = function(knex, Promise) {
  return Promise.all([
    knex.select().table('organizations_cases').del(),
    knex.select().table('representatives_cases').del(),
    knex.select().table('case_category_representative_assignments').del(),
  ])
  .then(() => {
    return Promise.all([
      knex.select().table('cases').del(),
      knex.select().table('case_categorys').del(),
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
