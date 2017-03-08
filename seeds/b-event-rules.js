import { logger } from '../api/logger';

exports.seed = function(knex, Promise) {
  return Promise.all([
    knex('event_rules').del(),
  ]);
};
