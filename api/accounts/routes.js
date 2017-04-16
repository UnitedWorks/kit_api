import { Router } from 'express';
import geocoder from '../services/geocoder';
import * as OSM from '../constants/open-street-maps';
import * as helpers from './helpers';
import { logger } from '../logger';
import { saveLocation } from '../knowledge-base/helpers';
import { Constituent, Representative, Organization } from './models';
import { requireAuth } from '../services/passport';
import SlackService from '../services/slack';

const router = new Router();

// Organizations
router.get('/organizations', (req, res) => {
  Organization.fetchAll({ withRelated: ['location', 'integrations', 'messageEntries'] }).then((orgs) => {
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
 * @param {String} [organization.type] - Enum: 'government', 'provider'
 * @return {Object} Organization document on 'organization'
 */
router.post('/organization', requireAuth, (req, res, next) => {
  logger.info('Creation Requested - Organization');
  const address = req.body.address;
  if (!address.city || !address.state || !address.country) {
    next('Missing address city, state, or country');
  }
  const organization = req.body.organization;
  if (!organization.type) organization.type = 'government';
  // Get location
  geocoder(`${address.city}, ${address.state}, ${address.country}`, [OSM.ADMINISTRATIVE, OSM.CITY, OSM.TOWN, OSM.HAMLET])
    .then((geoData) => {
      if (geoData.length === 0) {
        return next('No locations found.');
      }
      helpers.checkForAdminOrganizationAtLocation(geoData[0]).then((orgExists) => {
        if (orgExists) {
          return next('A city in that state seems to have already been registered.');
        } else {
          saveLocation(geoData[0], { returnJSON: true }).then((location) => {
            const orgWithLocation = Object.assign(organization, { location_id: location.id });
            // Create organization
            helpers.createOrganization(orgWithLocation, { returnJSON: true })
              .then((newOrganization) => {
                new SlackService({ username: 'Welcome', icon: 'capitol' }).send(`Organization *${newOrganization.name}* just signed up!`);
                res.status(200).json({ organization: newOrganization });
              }).catch(error => next(error));
          }).catch(error => next(error));
        }
      }).catch(error => next(error));
    }).catch(error => next(error));
});

router.post('/organizations/add-provider', requireAuth, (req, res, next) => {
  try {
    const organization = req.body.organization;
    if (organization.type == null || organization.type !== 'provider') {
      throw new Error('Not a Provider Organization');
    }
    helpers.createOrganization(organization, { returnJSON: true })
    .then((newOrganization) => {
      res.status(200).json({ organization: newOrganization });
    }).catch(error => next(error));
  } catch (e) {
    next(e);
  }
});

router.post('/organizations/add-representative', requireAuth, (req, res) => {
  helpers.addRepToOrganization(req.body.representative, req.body.organization, { returnJSON: true })
    .then(response => res.status(200).send({
      representative: response,
    }))
    .catch(error => res.status(400).send({ error }));
});

// Representatives
router.route('/representative')
  .get((req, res) => {
    Representative.where(req.query).fetch({ withRelated: ['organization', 'organization.integrations', 'organization.messageEntries'] })
      .then((representative) => {
        if (representative) {
          res.status(200).send({ representative });
        } else {
          res.status(400).send('No representative found');
        }
      }).catch(error => res.status(400).send({ error }));
  })
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
  .post(requireAuth, (req, res, next) => {
    logger.info('Creation Requested - Representative');
    const rep = req.body.representative;
    const org = req.body.organization;
    helpers.createRepresentative(rep, org, { returnJSON: true })
      .then((newRepresentative) => {
        res.status(200).json({ representative: newRepresentative });
      }).catch(error => next(error));
  })
  .put(requireAuth, (req, res) => {
    helpers.updateRepresentative(req.body.representative, { returnJSON: true })
      .then(updatedRep => res.status(200).send({ representative: updatedRep }))
      .catch(error => res.status(400).send({ error }));
  });

router.put('/representative/change-password', requireAuth, (req, res) => {
  helpers.changePassword(req.body.representative)
    .then(() => res.status(200).send())
    .catch(error => res.status(400).send({ error }));
});

router.get('/representatives', (req, res) => {
  Representative.where(req.query).fetchAll({ withRelated: ['organization'] })
    .then(representatives => res.status(200).send({ representatives }))
    .catch(error => res.status(400).send({ error }));
});

// Constituents
router.get('/constituents', (req, res) => {
  Constituent.fetchAll()
    .then(cons => res.status(200).send(cons))
    .catch(error => res.status(400).send({ error }));
});

module.exports = router;
