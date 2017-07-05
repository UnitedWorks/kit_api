
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('survey_questions', (table) => {
      table.renameColumn('prompt', 'instruction');
      table.renameColumn('survey_id', 'prompt_id');
    })
    .alterTable('survey_answers', (table) => {
      table.renameColumn('survey_question_id', 'prompt_step_id');
    })
    .alterTable('knowledge_answers', (table) => {
      table.renameColumn('survey_id', 'prompt_id');
    })
    .renameTable('surveys', 'prompts')
    .renameTable('survey_answers', 'prompt_responses')
    .renameTable('survey_questions', 'prompt_steps');
};

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('prompt_steps', (table) => {
      table.renameColumn('instruction', 'prompt');
      table.renameColumn('prompt_id', 'survey_id');
    })
    .alterTable('prompt_responses', (table) => {
      table.renameColumn('prompt_step_id', 'survey_question_id');
    })
    .alterTable('knowledge_answers', (table) => {
      table.renameColumn('prompt_id', 'survey_id');
    })
    .renameTable('prompts', 'surveys')
    .renameTable('prompt_responses', 'survey_answers')
    .renameTable('prompt_steps', 'survey_questions');
};
