import { Router } from 'express';
import { logger } from '../logger';
import { geocoder } from '../services/geocoder';
import { saveLocation } from '../knowledge-base/helpers'
import { createOrganization, createRepresentative } from '../accounts/helpers';

const router = new Router();

/**
 * Create a new organization
 * @param {String} address - Provided string to find, create, and associate a location
 * @param {Object} organization - Organiation object
 * @param {String} organization.name - Formal organization name (ex: City of New Brunswick)
 * @param {String} organization.website - General website
 * @param {String} organization.email - General contact email
 * @param {String} organization.phone - General contact phone
 * @param {String} organization.category - Enum: 'public', 'private', 'ngo'
 * @param {String} organization.type - Enum: 'admin', 'division'
 * @return {Object} Organization document on 'organization'
 */
router.post('/signup/organization', (req, res) => {
  logger.info('Signup Requested - Organization');
  const address = req.body.address;
  const organization = req.body.organization;
  // Get location
  geocoder.geocode(address).then((geoData) => {
    if (geoData.length > 1) {
      const errorMessage = 'Found more than one location, be more specific';
      logger.error(errorMessage);
      res.status(400).send(errorMessage);
    }
    saveLocation(geoData[0], { toJSON: true }).then((location) => {
      const orgWithLocation = Object.assign(organization, { location_id: location.id });
      // Create organization
      createOrganization(orgWithLocation).then((newOrganization) => {
        res.status(200).json({ organization: newOrganization });
      });
    });
  });
});

/**
 * Create a representative and associate with an organization
 * @param {Object} representative - Representative Object
 * @param {String} representative.name - Representative's full name
 * @param {String} representative.title - Job title
 * @param {String} representative.email - Work email
 * @param {String} representative.phone - Phone number (eventually should be an object)
 * @param {Object} organization - Organization to associate the representative with
 * @param {Object} organization.id - Organization identifier
 * @return {Object} Representative document on 'representative'
 */
router.post('/signup/representative', (req, res) => {
  logger.info('Signup Requested - Representative');
  const rep = req.body.representative;
  const org = req.body.organization;
  createRepresentative(rep, org).then((newRepresentative) => {
    res.status(200).json(newRepresentative);
  });
});

module.exports = router;
