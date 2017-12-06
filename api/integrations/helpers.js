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
