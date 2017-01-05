import { bookshelf } from '../orm';
// import * as conversations from '../conversations/models';

export const Representative = bookshelf.Model.extend({
  tableName: 'representatives',
  organization: () => this.belongsTo(Organization, 'organization_id'),
});

export const Constituent = bookshelf.Model.extend({
  tableName: 'constituents',
});

export const Organization = bookshelf.Model.extend({
  tableName: 'organizations',
  representatives: () => this.hasMany(Representative, 'organization_id'),
  narrativeSources: () => this.hasMany(OrganizationNarrativeSources, 'organization_id'),
});

export const OrganizationNarrativeSources = bookshelf.Model.extend({
  tableName: 'organizations_narrative_sources',
});
