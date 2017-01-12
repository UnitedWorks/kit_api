import { bookshelf } from '../orm';
import * as KnowledgeModels from '../knowledge-base/models';
import * as AccountModels from '../accounts/models';

// Modules contain intents. Multiple modules may hold the same intent.
export const NarrativeSource = bookshelf.Model.extend({
  tableName: 'narrative_sources',
});

// Intents have responses, which can take different sources of information.
export const NarrativeStore = bookshelf.Model.extend({
  tableName: 'narrative_sessions',
  hasTimestamps: true,
  constituent: function() {
    return this.hasOne(AccountModels.Constituent, 'constituent_id');
  },
  organization: function() {
    return this.hasOne(AccountModels.Organization, 'organization_id');
  },
});
