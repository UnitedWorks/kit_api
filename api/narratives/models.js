import { bookshelf } from '../orm';
import * as KnowledgeModels from '../knowledge-base/models';
import * as AccountModels from '../accounts/models';

// Modules contain intents. Multiple modules may hold the same intent.
export const NarrativeModule = bookshelf.Model.extend({
  tableName: 'narrative_modules',
  intents: function() {
    return this.hasMany(NarrativeIntent);
  },
});

// Intents have responses, which can take different sources of information.
export const NarrativeIntent = bookshelf.Model.extend({
  tableName: 'narrative_intents',
  module: function() {
    return this.hasOne(NarrativeModule, 'narrative_module_id');
  },
});

// Responses are associated with intents. These are specific to a city.
// Some intents may use external APIs over an internal response
// TO DO: associate representatives with responses for forwarding user input
export const NarrativeResponse = bookshelf.Model.extend({
  tableName: 'narrative_scripts',
  organization: function() {
    return this.hasOne(AccountModels.Organization, 'organization_id');
  },
  response: function() {
    return this.belongsToMany(KnowledgeModels.KnowledgeAnswer);
  },
});
