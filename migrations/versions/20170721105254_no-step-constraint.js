
exports.up = function(knex, Promise) {
  return knex.schema
    .raw('ALTER TABLE prompt_steps DROP CONSTRAINT IF EXISTS survey_questions_type_check');
};

exports.down = function(knex, Promise) {

};
