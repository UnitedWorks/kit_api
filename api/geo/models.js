import { bookshelf } from '../orm';

export const Location = bookshelf.Model.extend({
  tableName: 'locations',
});
