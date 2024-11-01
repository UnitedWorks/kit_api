import { bookshelf } from '../orm';
import * as AccountModels from '../accounts/models';

// Intents have responses, which can take different sources of information.
export const NarrativeSession = bookshelf.Model.extend({
  tableName: 'narrative_sessions',
  hasTimestamps: true,
  constituent() {
    return this.belongsTo(AccountModels.Constituent, 'constituent_id');
  },
  organization() {
    return this.belongsTo(AccountModels.Organization, 'organization_id');
  },
});
