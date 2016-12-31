
exports.up = function(knex, Promise) {
  return knex.schema
    // Engagement/Narrative Tables
    // .createTable('engagement_modules', () => {})
    // .createTable('engagement_intents', () => {})
    // .createTable('engagement_scripts', () => {})

    // Relationship Tables (references tables in knowledge migration script)
    // .createTable('engagement_script_answers', () => {})
    // .createTable('engagement_script_events', () => {})
    // .createTable('engagement_script_facilitys', () => {})
    // .createTable('engagement_script_services', () => {});
};

exports.down = function(knex, Promise) {

};
