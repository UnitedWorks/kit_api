import { Router } from 'express';
import { geocoder } from '../services/geocoder';
import * as helpers from './helpers';
import { logger } from '../logger';
import { saveLocation } from '../knowledge-base/helpers';
import { Constituent, Representative, Organization } from './models';
import SlackService from '../services/slack';

const router = new Router();

// Organizations
router.get('/organizations', (req, res) => {
  Organization.fetchAll({ withRelated: ['location', 'integrations'] }).then((orgs) => {
    res.status(200).send({ organizations: orgs });
  });
});

/**
 * Create a new organization
 * @param {String} address - Provided string to find, create, and associate a location
 * @param {Object} organization - Organiation object
 * @param {String} organization.name - Formal organization name (ex: City of New Brunswick)
 * @param {String} [organization.website] - General website
 * @param {String} [organization.email] - General contact email
 * @param {String} [organization.phone] - General contact phone
 * @param {String} organization.category - Enum: 'public', 'private', 'ngo'
 * @param {String} [organization.type] - Enum: 'admin', 'division'
 * @return {Object} Organization document on 'organization'
 */
router.post('/organization', (req, res) => {
  logger.info('Creation Requested - Organization');
  const address = req.body.address;
  if (!address.city || !address.state || !address.zipcode || !address.country) {
    res.status(400).send("Missing address 'city', 'state', 'zipcode', or 'country'");
  }
  const organization = req.body.organization;
  if (!organization.type) organization.type = 'admin';
  // Get location
  geocoder.geocode(`${address.city} ${address.state}, ${address.zipcode}, ${address.country}`).then((geoData) => {
    const cityOnlyGeoData = geoData.filter(location => location.city);
    if (cityOnlyGeoData.length > 1) {
      const errorMessage = 'Found more than one location, be more specific.';
      logger.error(errorMessage);
      res.status(400).send(errorMessage);
    } else if (cityOnlyGeoData.length === 0) {
      const errorMessage = 'No locations found.';
      logger.error(errorMessage);
      res.status(400).send(errorMessage);
    }
    helpers.checkForAdminOrganizationAtLocation(cityOnlyGeoData[0]).then((orgExists) => {
      if (orgExists) {
        res.status(400).send('A city in that state seems to have already been registered.');
      } else {
        saveLocation(cityOnlyGeoData[0], { returnJSON: true }).then((location) => {
          const orgWithLocation = Object.assign(organization, { location_id: location.id });
          // Create organization
          helpers.createOrganization(orgWithLocation, { returnJSON: true })
            .then((newOrganization) => {
              new SlackService({ username: 'Welcome', icon: 'capitol' }).send(`Organization *${newOrganization.name}* just signed up!`);
              res.status(200).json({ organization: newOrganization });
            }).catch(error => res.status(400).send(error));
        }).catch(error => res.status(400).send(error));
      }
    }).catch(error => res.status(400).send(error));
  }).catch(error => res.status(400).send(error));
});

router.post('/organizations/add-representative', (req, res) => {
  helpers.addRepToOrganization(req.body.representative, req.body.organization, { returnJSON: true })
    .then(response => res.status(200).send({
      representative: response,
    }))
    .catch(err => res.status(400).send(err));
});

// Representatives
router.get('/representative', (req, res) => {
  Representative.where(req.query).fetch({ withRelated: ['organization'] })
    .then((representative) => {
      if (representative) {
        res.status(200).send({ representative });
      } else {
        res.status(400).send('No representative found');
      }
    }).catch(err => res.status(400).send(err));
});

router.get('/representatives', (req, res) => {
  Representative.where(req.query).fetchAll({ withRelated: ['organization'] })
    .then(representatives => res.status(200).send({ representatives }))
    .catch(err => res.status(400).send(err));
});

/**
 * Create a representative and associate with an organization
 * @param {Object} representative - Representative Object
 * @param {String} [representative.name] - Representative's full name
 * @param {String} [representative.title] - Job title
 * @param {String} representative.email - Work email
 * @param {String} [representative.phone] - Phone number (eventually should be an object)
 * @param {Object} [organization] - Organization to associate the representative with
 * @param {Number} [organization.id] - Organization identifier
 * @return {Object} Representative document on 'representative'
 */
router.post('/representative', (req, res) => {
  logger.info('Creation Requested - Representative');
  const rep = req.body.representative;
  const org = req.body.organization;
  helpers.createRepresentative(rep, org, { returnJSON: true })
    .then((newRepresentative) => {
      new SlackService({ username: 'Welcome', icon: 'capitol' })
        .send(`Representative joined: *${newRepresentative.email}*`);
      res.status(200).json({ representative: newRepresentative });
    }).catch(error => res.status(400).send(error));
});

router.put('/representative', (req, res) => {
  helpers.updateRepresentative(req.body.representative, { returnJSON: true })
    .then(updatedRep => res.status(200).send({ representative: updatedRep }))
    .catch(err => res.status(400).send(err));
});

// Constituents
router.get('/constituents', (req, res) => {
  Constituent.fetchAll().then((cons) => {
    res.status(200).send(cons);
  });
});

module.exports = router;
