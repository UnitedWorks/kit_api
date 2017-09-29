import { bookshelf } from '../orm';

export const ShoutOut = bookshelf.Model.extend({
  tableName: 'shout_outs',
  hasTimeStamps: true,
});
