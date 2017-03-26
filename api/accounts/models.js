import { bookshelf } from '../orm';
import * as KnowledgeModels from '../knowledge-base/models';
import * as CaseModels from '../cases/models';
import * as IntegrationModels from '../integrations/models';
import * as ConversationModels from '../conversations/models';

export const Representative = bookshelf.Model.extend({
  tableName: 'representatives',
  organization: function () {
    return this.belongsTo(Organization, 'organization_id');
  },
  cases: function () {
    return this.belongsToMany(CaseModels.Case, 'representatives_cases');
  },
});

export const Constituent = bookshelf.Model.extend({
  tableName: 'constituents',
  organizations: function () {
    return this.belongsToMany(Organization, 'organizations_constituents');
  },
  cases: function() {
    return this.hasMany(CaseModels.Case, 'constituent_id');
  },
});

export const Organization = bookshelf.Model.extend({
  tableName: 'organizations',
  representatives: function () {
    return this.hasMany(Representative, 'organization_id');
  },
  constituents: function () {
    return this.belongsToMany(Constituent, 'organizations_constiuents');
  },
  integrations: function () {
    return this.belongsToMany(IntegrationModels.Integration, 'organizations_integrations');
  },
  location: function () {
    return this.belongsTo(KnowledgeModels.Location, 'location_id');
  },
  cases: function() {
    return this.belongsToMany(CaseModels.Case, 'organizations_cases');
  },
  messageEntries: function() {
    return this.hasMany(ConversationModels.MessageEntry, 'organization_id');
  },
});

export const OrganizationConstituents = bookshelf.Model.extend({
  tableName: 'organizations_constituents',
});
