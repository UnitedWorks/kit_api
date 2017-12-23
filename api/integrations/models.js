import { bookshelf } from '../orm';
import { Organization } from '../accounts/models';

export const Integration = bookshelf.Model.extend({
  tableName: 'integrations',
  hidden: ['_pivot_organization_id', '_pivot_integration_id'],
  organizations() {
    return this.belongsToMany(Organization, 'organizations_integrations');
  },
});

export const OrganizationIntegrations = bookshelf.Model.extend({
  tableName: 'organizations_integrations',
  organization() {
    return this.belongsTo(Organization, 'organization_id');
  },
  integration() {
    return this.belongsTo(Integration, 'integration_Id');
  },
});
