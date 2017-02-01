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
      return questionSeed(obj);
    });
  };

  const questionSeed = (obj) => {
    const questionInserts = [];
    const generalCategoryId = obj.categoryIds[obj.categoryIds.length - 1];
    questionInserts.push(knex('knowledge_questions').insert({
      label: 'employment-job-training',
      question: 'Where can I get basic job training?',
      knowledge_category_id: generalCategoryId,
    }, 'id'));
    questionInserts.push(knex('knowledge_questions').insert({
      label: 'sanitation-garbage-schedule',
      question: 'What day is trash pickup?',
      knowledge_category_id: generalCategoryId,
    }, 'id'));
    questionInserts.push(knex('knowledge_questions').insert({
      label: 'sanitation-recycling-schedule',
      question: 'Which day is recycling?',
      knowledge_category_id: generalCategoryId,
    }, 'id'));
    questionInserts.push(knex('knowledge_questions').insert({
      label: 'sanitation-compost',
      question: 'When do you collect compost?',
      knowledge_category_id: generalCategoryId,
    }, 'id'));
    questionInserts.push(knex('knowledge_questions').insert({
      label: 'sanitation-bulk-pickup',
      question: 'How can I request bulk item pickup?',
      knowledge_category_id: generalCategoryId,
    }, 'id'));
    questionInserts.push(knex('knowledge_questions').insert({
      label: 'sanitation-electronics-disposal',
      question: 'Where can I dispose of electronics?',
      knowledge_category_id: generalCategoryId,
    }, 'id'));
    return Promise.all(questionInserts).then((data) => {
      obj['eventIds'] = [].concat(...data);
      return finishSeed(obj);
    });
  }
  const finishSeed = (obj) => {
    return logger.info(obj);
  };

  const startSeed = () => {
    const getNewBrunswick = knex.select().where('name', 'City of New Brunswick').from('organizations');
    const getJerseyCity = knex.select().where('name', 'Jersey City').from('organizations');
    const getHanover = knex.select().where('name', 'Hanover Township').from('organizations');
    const getSanFrancisco = knex.select().where('name', 'San Francisco').from('organizations');
    return new Promise.join(getNewBrunswick, getJerseyCity, getHanover, getSanFrancisco,
      (newBrunswick, jerseyCity, hanover, sanFrancisco) => {
        return {
          newBrunswick: newBrunswick[0].id,
          jerseyCity: jerseyCity[0].id,
          hanover: hanover[0].id,
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
