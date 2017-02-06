import { Organization } from '../accounts/models';
import { saveLocation } from '../knowledge-base/helpers';
import { Integration, IntegrationsLocations, OrganizationIntegrations } from './models';
import { geocoder } from '../services/geocoder';

export const getIntegrations = (params, options) => {
  if (params.organization.id) {
    return Integration.fetchAll({ withRelated: ['locations'] }).then((integrationModels) => {
      return Organization.where({ id: params.organization.id }).fetch({ withRelated: ['integrations', 'location'] }).then((orgModel) => {
        const mappedIntegrations = integrationModels.toJSON();
        // Diff integrations an organization has, and set 'enabled'/'available' booleans
        return mappedIntegrations.map((baseIntegration) => {
          const updatedIntegration = baseIntegration;
          updatedIntegration.enabled = false;
          updatedIntegration.available = false;
          // Set 'enabled' flag
          orgModel.toJSON().integrations.forEach((orgIntegration) => {
            // Found relationship in table 'organizations_integrations'
            if (updatedIntegration.id === orgIntegration.id) {
              updatedIntegration.enabled = true;
            }
          });
          // Set 'available' flag - check org city against integration locations
          const orgLocation = orgModel.toJSON().location;
          updatedIntegration.locations.forEach((whiteListedLocation) => {
            if (whiteListedLocation.countryCode === orgLocation.countryCode) {
              if (whiteListedLocation.administrativeLevels.level1short ===
                  orgLocation.administrativeLevels.level1short) {
                // If county or city dont exist, its good. If more details, do more checks
                if (!whiteListedLocation.administrativeLevels.level2short ||
                    !whiteListedLocation.city) {
                  updatedIntegration.available = true;
                } else {
                  // If county is specified, check for match
                  if (whiteListedLocation.administrativeLevels.level2short) {
                    updatedIntegration.available = (
                      whiteListedLocation.administrativeLevels.level2short ===
                      orgLocation.administrativeLevels.level2short);
                    // If county matched, city may still be different and a city
                    if (updatedIntegration.available && whiteListedLocation.city) {
                      // Check if cities match
                      updatedIntegration.available = whiteListedLocation.city === orgLocation.city;
                    }
                  // If county wasn't specified, still check city
                  } else if (whiteListedLocation.city) {
                    updatedIntegration.available = (
                      whiteListedLocation.administrativeLevels.level2short ===
                      orgLocation.administrativeLevels.level2short);
                  }
                }
              }
            }
          })
          return updatedIntegration;
        });
      }).catch(error => error);
    }).catch(error => error);
  } else {
    return Integration.fetchAll({ withRelated: ['locations'] }).then((integrationModels) => {
      return options.returnJSON ? integrationModels.toJSON() : integrationModels;
    });
  }
};

export const addIntegrationRestriction = (params) => {
  if (!params.integration) throw Error('No integration specified');
  if (!params.location) throw Error('No location specified');
  return geocoder.geocode(`${params.location.formatted_address}`).then((geoData) => {
    if (geoData.length > 1) {
      throw Error('Found more than one location');
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

export const setForOrganization = (params) => {
  return getIntegrations(params, { returnJSON: true }).then((orgIntegrations) => {
    const integrationToBeSet = orgIntegrations.filter(
      integration => integration.id === params.integration.id)[0];
    // If we're trying to enable an unavailable integration, throw error, otherwise go for it
    if (!integrationToBeSet.available && params.integration.enabled) {
      throw Error('Integration Unavailable for this Organization');
    } else {
      if (params.integration.enabled) {
        return OrganizationIntegrations.forge({
          organization_id: params.organization.id,
          integration_id: integrationToBeSet.id,
        }).save().then(() => {
          integrationToBeSet.enabled = true;
          return integrationToBeSet;
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
};
