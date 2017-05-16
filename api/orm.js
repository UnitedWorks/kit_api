export const knex = require('knex')({
  client: 'pg',
  connection: {
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_USER_PASSWORD,
    database: process.env.DATABASE_NAME,
    charset: process.env.DATABASE_CHARSET,
  },
});

export const bookshelf = require('bookshelf')(knex);
// Native Bookshelf Plugins
bookshelf.plugin('pagination');
bookshelf.plugin('registry');
bookshelf.plugin('virtuals');
bookshelf.plugin('visibility');

export const st = require('knex-postgis')(knex);
