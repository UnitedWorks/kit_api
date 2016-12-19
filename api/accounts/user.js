import { bookshelf } from '../bookshelf';

export let User = bookshelf.Model.extend({
  tableName: 'User',
});
