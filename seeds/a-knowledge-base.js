import { logger } from '../api/logger';
import * as KnowledgeConstants from '../api/constants/knowledge-base';

exports.seed = function(knex, Promise) {

  const categorySeed = (obj) => {
    const categoryInserts = [];
    KnowledgeConstants.CATEGORIES.forEach((category) => {
      categoryInserts.push(knex('knowledge_categorys').insert({
        label: category,
      }, 'id'));
    });
    return Promise.all(categoryInserts).then((data) => {
      obj['categoryIds'] = [].concat(...data);
      return finishSeed(obj);
    });
  };

  const finishSeed = (obj) => {
    return logger.info(obj);
  };

  const startSeed = () => {
    const getNewBrunswick = knex.select().where('name', 'City of New Brunswick').from('organizations');
    const getJerseyCity = knex.select().where('name', 'Jersey City').from('organizations');
    const getHighlandPark = knex.select().where('name', 'Highland Park').from('organizations');
    const getSanFrancisco = knex.select().where('name', 'San Francisco').from('organizations');
    return new Promise.join(getNewBrunswick, getJerseyCity, getHighlandPark, getSanFrancisco,
      (newBrunswick, jerseyCity, highlandPark, sanFrancisco) => {
        return {
          newBrunswick: newBrunswick[0].id,
          jerseyCity: jerseyCity[0].id,
          highlandPark: highlandPark[0].id,
          sanFrancisco: sanFrancisco[0].id,
        };
    }).then((orgs) => {
      return categorySeed({
        organizationIds: orgs,
      });
    });
  };

  return startSeed();
};
