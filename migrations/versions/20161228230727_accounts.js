
exports.up = function (knex, Promise) {
  return knex.schema
    .createTable('organizations', function(table) {
      table.increments('id').primary();
      table.string('name');
      table.string('abbreviation');
      table.string('email');
      table.string('phone');
      table.string('website');
      table.integer('parent_organization_id')
        .unsigned()
        .references('id')
        .inTable('organizations')
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
      // To add:
      // location
      // To debate:
      //  Rather than parent/child orgs, do we use an enum of department names
      //  that a representative can assign themselves to? That means
      //  no nesting, using enums as filters, and updating on an enum's change
    })
    .createTable('constituents', function(table) {
      table.increments('id').primary();
      table.string('email');
      table.string('phone');
      table.string('facebook_id');
      table.string('twitter_handle');
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
      // To add:
      // location
      // gender?
    })
    .createTable('representatives', function(table) {
      table.increments('id').primary();
      table.string('name');
      table.string('email');
      table.string('phone');
      table.string('password');
      table.string('salt');
      table.boolean('email_confirmed').defaultTo(false);
      table.integer('organization_id')
        .unsigned()
        .references('id')
        .inTable('organizations')
        .onDelete('CASCADE');
      table.dateTime('created_at').defaultTo(knex.raw('now()'));
      // To add:
      // display_name
      // avatar url
    });
};

exports.down = function (knex, Promise) {
  return knex.schema
    .dropTable('constituents')
    .dropTable('representatives')
    .dropTable('organizations');
};
