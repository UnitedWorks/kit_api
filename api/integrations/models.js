import { bookshelf } from '../orm';
import { Organization } from '../accounts/models';

export const Integration = bookshelf.Model.extend({
  tableName: 'integrations',
});

export const OrganizationIntegrations = bookshelf.Model.extend({
  tableName: 'organizations_integrations',
  organization() {
    return this.belongsTo(Organization, 'organization_id');
  },
});
