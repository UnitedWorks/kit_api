import { bookshelf } from '../orm';
import * as KnowledgeModels from '../knowledge-base/models';
import * as NarrativeModels from '../narratives/models';
import * as CaseModels from '../cases/models';

export const OrganizationsConstituents = bookshelf.Model.extend({
  tableName: 'organizations_constituents',
});

export const OrganizationNarrativeSources = bookshelf.Model.extend({
  tableName: 'organizations_narrative_sources',
});

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
});

export const Organization = bookshelf.Model.extend({
  tableName: 'organizations',
  representatives: function () {
    return this.hasMany(Representative, 'organization_id');
  },
  constituents: function () {
    return this.belongsToMany(Constituent, 'organizations_constiuents');
  },
  narrativeSources: function () {
    return this.belongsToMany(NarrativeModels.NarrativeSource, 'organizations_narrative_sources');
  },
  location: function () {
    return this.belongsTo(KnowledgeModels.Location, 'location_id');
  },
  cases: function() {
    return this.belongsToMany(CaseModels.Case, 'organizations_cases');
  },
});
