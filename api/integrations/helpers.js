import { Organization } from '../accounts/models';
import { saveLocation } from '../geo/helpers';
import { Integration, IntegrationsLocations, OrganizationIntegrations } from './models';
import geocode from '../utils/geocoder';
import { logger } from '../logger';

export const getIntegrations = (params, options = { returnJSON: true }) => {
  if (params.organization.id) {
    return Integration.fetchAll({ withRelated: ['locations'] }).then((integrationModels) => {
      return Organization.where({ id: params.organization.id }).fetch({ withRelated: ['integrations', 'location'] }).then((orgModel) => {
        return OrganizationIntegrations.where({ organization_id: params.organization.id }).fetchAll().then((junctionRows) => {
          const mappedIntegrations = integrationModels.toJSON();
          const junctions = junctionRows.toJSON();
          // Diff integrations an organization has, and set 'enabled'/'available' booleans
          return mappedIntegrations.map((baseIntegration) => {
            const updatedIntegration = baseIntegration;
            updatedIntegration.enabled = false;
            updatedIntegration.available = false;
            // Set 'enabled' flag
            junctions.forEach((junction) => {
              // Found relationship in table 'organizations_integrations'
              if (updatedIntegration.id === junction.integration_id) {
                updatedIntegration.enabled = true;
                updatedIntegration.config = junction.config;
              }
            });
            // If government, set 'available' flag - check org city against integration locations
            if (orgModel.toJSON().type === 'government') {
              const orgLocation = orgModel.toJSON().location;
              updatedIntegration.locations.forEach((whiteListedLocation) => {
                if (whiteListedLocation.country_code === orgLocation.country_code) {
                  if (!whiteListedLocation.address.state) {
                    updatedIntegration.available = true;
                  } else if (whiteListedLocation.address.state ===
                    orgLocation.address.state) {
                      // If county or city dont exist, its good. If more details, do more checks
                      if (!whiteListedLocation.address.county ||
                        !whiteListedLocation.city) {
                          updatedIntegration.available = true;
                        } else {
                          // If county is specified, check for match
                          if (whiteListedLocation.address.county) {
                            updatedIntegration.available = (
                              whiteListedLocation.address.county ===
                              orgLocation.address.county);
                              // If county matched, city may still be different and a city
                              if (updatedIntegration.available && whiteListedLocation.city) {
                                // Check if cities match
                                updatedIntegration.available = whiteListedLocation.city === orgLocation.city;
                              }
                              // If county wasn't specified, still check city
                            } else if (whiteListedLocation.city) {
                              updatedIntegration.available = (
                                whiteListedLocation.address.county ===
                                orgLocation.address.county);
                              }
                            }
                          }
                        }
                      });
                    } else if (orgModel.toJSON().type === 'provider') {
                      updatedIntegration.available = true;
                    }
                    return updatedIntegration;
                  });
        });
      }).catch(error => error);
    }).catch(error => error);
  }
  return Integration.fetchAll({ withRelated: ['locations'] }).then((integrationModels) => {
    return options.returnJSON ? integrationModels.toJSON() : integrationModels;
  });
};

export const checkIntegration = (organization, integration = {}) => {
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
};

export const hasIntegration = (organization, integrationLabel) => {
  return checkIntegration(organization, { label: integrationLabel })
    .then(bool => bool)
    .catch(error => error);
};

export const addIntegrationRestriction = (params) => {
  if (!params.integration) throw Error('No integration specified');
  if (!params.location) throw Error('No location specified');
  return geocode(`${params.location.display_name}`).then((geoData) => {
    if (geoData.length > 1) {
      logger.warn('More than 1 location', geoData)
    }
    return saveLocation(geoData[0]).then((location) => {
      return IntegrationsLocations.forge({
        location_id: location.get('id'),
        integration_id: params.integration.id,
      }).save();
    });
  });
};

export const removeIntegrationRestriction = (params) => {
  if (!params.integration) throw Error('No integration specified');
  if (!params.location) throw Error('No location specified');
  return IntegrationsLocations.where({
    location_id: params.location.id,
    integration_id: params.integration.id,
  }).destroy({ require: true });
};

export const createIntegration = (params, options) => {
  return Integration.forge(params).save(null, { method: 'insert' }).then((integrationModel) => {
    return options.returnJSON ? integrationModel.toJSON() : integrationModel;
  });
};

export const updateIntegration = (params, options) => {
  return Integration.where({ id: params.id }).save({
    title: params.title,
    description: params.description,
    url: params.url,
  }, { patch: true, method: 'update' }).then((integrationModel) => {
    return options.returnJSON ? integrationModel.toJSON() : integrationModel;
  });
};

export const deleteIntegration = (params) => {
  return Integration.where({ id: params.integration.id }).destroy({ required: true });
};

export function setForOrganization(params) {
  return getIntegrations(params).then((orgIntegrations) => {
    const integrationToBeSet = orgIntegrations.filter(
      integration => integration.id === params.integration.id)[0];
    // If we're trying to enable an unavailable integration, throw error, otherwise go for it
    if (!integrationToBeSet.available && params.integration.enabled) {
      throw Error('Integration Unavailable for this Organization');
    } else {
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
    }
  });
}
