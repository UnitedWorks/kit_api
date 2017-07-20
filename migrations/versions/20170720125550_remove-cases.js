
exports.up = function(knex, Promise) {
  return knex.schema
    .dropTable('cases_medias')
    .dropTable('cases_locations')
    .dropTable('organizations_cases')
    .dropTable('cases')
    .dropTable('case_categorys');
};

exports.down = function(knex, Promise) {

};
