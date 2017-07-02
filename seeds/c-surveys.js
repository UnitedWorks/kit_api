exports.seed = function(knex, Promise) {
  return Promise.all([
    knex('prompts').insert({
      label: 'general_complaint',
      name: 'General Complaint Prompt',
      concluding_survey: 'create_case',
    }, 'id').then(ids => ids[0]),
    knex('prompts').insert({
      label: 'single_response',
      concluding_survey: 'create_case',
    }, 'id').then(ids => ids[0]),
  ]).then((ids) => {
    return Promise.all([
      knex('prompt_steps').insert({
        survey_id: ids[0],
        instruction: 'Can you describe your problem?',
        type: 'text',
        position: 0,
      }),
      knex('prompt_steps').insert({
        survey_id: ids[0],
        instruction: 'Can you send a picture?',
        type: 'picture',
        position: 1,
      }),
      knex('prompt_steps').insert({
        survey_id: ids[0],
        instruction: 'Can you send your location?',
        type: 'text',
        position: 2,
      }),
      knex('prompt_steps').insert({
        survey_id: ids[1],
        type: 'text',
        position: 0,
      }),
    ]);
  });
};
