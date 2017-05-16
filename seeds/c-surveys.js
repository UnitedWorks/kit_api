import { logger } from '../api/logger';

exports.seed = function(knex, Promise) {
  return Promise.all([
    knex('surveys').insert({
      label: 'general_complaint',
      name: 'General Complaint Survey',
      concluding_survey: 'create_case',
    }, 'id').then(ids => ids[0]),
    knex('surveys').insert({
      label: 'single_response',
      concluding_survey: 'create_case',
    }, 'id').then(ids => ids[0]),
  ]).then((ids) => {
    return Promise.all([
      knex('survey_questions').insert({
        survey_id: ids[0],
        prompt: 'Can you describe your problem?',
        type: 'text',
        position: 0,
      }),
      knex('survey_questions').insert({
        survey_id: ids[0],
        prompt: 'Can you send a picture?',
        type: 'picture',
        position: 1,
      }),
      knex('survey_questions').insert({
        survey_id: ids[0],
        prompt: 'Can you send your location?',
        type: 'text',
        position: 2,
      }),
      knex('survey_questions').insert({
        survey_id: ids[1],
        type: 'text',
        position: 0,
      }),
    ]);
  });
};
