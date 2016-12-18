const knex = require('knex')({
  client: 'pg',
  connection: {
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_USER_PASSWORD,
    database: process.env.DATABASE_NAME,
    charset: process.env.CHARSET,
  },
});

export const db = require('bookshelf')(knex);
