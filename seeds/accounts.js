
exports.seed = (knex, Promise) => {
  // Deletes ALL existing entries
  return knex.select().table('organizations').del()
    .then(() => {
      // Clearing organizations first CASCADE deletes representatives with associated foreign keys
      // Then we clear unassociated representatives
      return Promise.all([
        knex.select().table('representatives').del(),
        knex.select().table('constituents').del()
      ]);
    })
    .then(() => {
      return Promise.all([
        // Inserts seed entries
        // Insert organizations first so rep's can use their IDs for foreign key
        knex('organizations').insert({
          name: 'Jersey City',
          website: 'www.cityofjerseycity.com',
        }, 'id').then((ids) => {
          return knex('representatives').insert({
            name: 'Billy Bob',
            email: 'bills@bob.com',
            password: '123456',
            organization_id: ids[0]
          });
        }),
        knex('organizations').insert({
          name: 'City of New Brunswick',
          website: 'www.thecityofnewbrunswick.org',
        }, 'id').then((ids) => {
          return knex('representatives').insert({
            name: 'Debbie Debs',
            email: 'debs@debbie.com',
            password: '123456',
            organization_id: ids[0],
          });
        })
      ]);
    });
};
