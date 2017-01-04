import { bookshelf } from '../orm';
// import * as conversations from '../conversations/models';

export const Representative = bookshelf.Model.extend({
  tableName: 'representatives',
  organization: () => this.belongsTo(Organization, 'organization_id'),
});

export const Constituent = bookshelf.Model.extend({
  tableName: 'constituents',
  // conversations: () => this.hasMany(conversations.Conversation),
});

export const Organization = bookshelf.Model.extend({
  tableName: 'organizations',
  narrativeModuleConfig: () => this.hasMany(OrganizationNarrativeModule, 'organization_id'),
  representatives: () => this.hasMany(Representative, 'organization_id'),
  // conversations: () => this.hasMany(conversations.Conversation),
});

export const OrganizationNarrativeModule = bookshelf.Model.extend({
  tableName: 'organizations_narrative_modules',
});
