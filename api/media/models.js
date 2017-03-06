import { bookshelf } from '../orm';

export const Media = bookshelf.Model.extend({
  tableName: 'medias',
});
