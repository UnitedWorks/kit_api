import { Integration, OrganizationIntegrations } from './models';

export async function getIntegrations(params, options = { returnJSON: true }) {
  if (params.organization.id) {
    const integrationsArray = await Integration.fetchAll().then(i => i.toJSON());
    const orgIntegrations = await OrganizationIntegrations.where({ organization_id: params.organization.id }).fetchAll().then(i => i.toJSON());
    return integrationsArray.map((integration) => {
      const intObj = integration;
      orgIntegrations.forEach((orgInt) => {
        if (orgInt.integration_id === integration.id) {
          intObj.config = orgInt.config;
          intObj.enabled = true;
        }
      })
      return intObj;
    });
  }
  return Integration.fetchAll().then((integrationModels) => {
    return options.returnJSON ? integrationModels.toJSON() : integrationModels;
  });
}

export function createIntegration(params, options) {
  return Integration.forge(params).save(null, { method: 'insert' }).then((integrationModel) => {
    return options.returnJSON ? integrationModel.toJSON() : integrationModel;
  });
}

export function updateIntegration(params, options) {
  return Integration.where({ id: params.id }).save({
    title: params.title,
    description: params.description,
    url: params.url,
  }, { patch: true, method: 'update' }).then((integrationModel) => {
    return options.returnJSON ? integrationModel.toJSON() : integrationModel;
  });
}

export function deleteIntegration(params) {
  return Integration.where({ id: params.integration.id }).destroy({ required: true });
}

export function checkIntegration(organization, integration = {}) {
  const integrationParams = {};
  if (integration.id) integrationParams.id = integration.id;
  if (integration.label) integrationParams.label = integration.label;
  return Integration.where(integrationParams).fetch().then((integrationModel) => {
    return OrganizationIntegrations.where({
      organization_id: organization.id,
      integration_id: integrationModel.get('id'),
    }).fetch().then((foundIntegration) => {
      if (foundIntegration) return true;
      return false;
    });
  });
}

export function setForOrganization(params) {
  return getIntegrations(params).then((orgIntegrations) => {
    const integrationToBeSet = orgIntegrations.filter(
      integration => integration.id === params.integration.id)[0];
    // If we're trying to enable an unavailable integration, throw error, otherwise go for it
    if (params.integration.enabled) {
      // If we're enabling, check if it already exists (Update vs. Save)
      return checkIntegration(params.organization, params.integration).then((active) => {
        if (!active) {
          return OrganizationIntegrations.forge({
            organization_id: params.organization.id,
            integration_id: integrationToBeSet.id,
            config: params.integration.config,
          }).save().then(() => {
            integrationToBeSet.enabled = true;
            return integrationToBeSet;
          });
        }
        return OrganizationIntegrations.where({
          organization_id: params.organization.id,
          integration_id: integrationToBeSet.id,
        }).save({
          organization_id: params.organization.id,
          integration_id: integrationToBeSet.id,
          config: params.integration.config,
        }, { method: 'update' }).then(() => {
          integrationToBeSet.enabled = true;
          return integrationToBeSet;
        });
      });
    }
    return OrganizationIntegrations.where({
      organization_id: params.organization.id,
      integration_id: integrationToBeSet.id,
    }).destroy().then(() => {
      integrationToBeSet.enabled = false;
      return integrationToBeSet;
    });
  });
}
