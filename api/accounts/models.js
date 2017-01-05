import { bookshelf } from '../orm';
import * as NarrativeModels from '../narratives/models';

export const Representative = bookshelf.Model.extend({
  tableName: 'representatives',
  organization: function() {
    return this.belongsTo(Organization, 'organization_id');
  },
});

export const Constituent = bookshelf.Model.extend({
  tableName: 'constituents',
  defaultOrganization: function() {
    return this.hasOne(Organization, 'default_organization_id');
  },
});

export const Organization = bookshelf.Model.extend({
  tableName: 'organizations',
  representatives: function() {
    return this.hasMany(Representative, 'organization_id');
  },
  constituents: function() {
    return this.belongsToMany(Constituent, 'default_organization_id');
  },
  narrativeSources: function() {
    return this.belongsToMany(NarrativeModels.NarrativeSource, 'organizations_narrative_sources');
  },
});

export const OrganizationNarrativeSources = bookshelf.Model.extend({
  tableName: 'organizations_narrative_sources',
});
