import { bookshelf } from '../orm';
import * as KnowledgeModels from '../knowledge-base/models';

export const Integration = bookshelf.Model.extend({
  tableName: 'integrations',
  locations() {
    return this.belongsToMany(KnowledgeModels.Location, 'integrations_locations');
  },
});

export const OrganizationIntegrations = bookshelf.Model.extend({
  tableName: 'organizations_integrations',
});

export const IntegrationsLocations = bookshelf.Model.extend({
  tableName: 'integrations_locations',
});
