import { Router } from 'express';
import * as helpers from './helpers';

const router = Router();


/**
 * Get Integrations
 * @param {string} [organization_id] - If org ID is provided, populate with availability/enabled
 * @return {Array} All integrations. Available/enabled flags present if organizaiton ID was provided
 */
router.get('/', (req, res) => {
  helpers.getIntegrations({
    organization: {
      id: req.query.organization_id,
    },
  }, { returnJSON: true })
    .then(integrations => res.status(200).send({ integrations }))
    .catch(err => res.status(400).send(err));
});

// Create integrations
router.post('/', (req, res) => {
  helpers.createIntegration(req.body.integration, { returnedJSON: true })
    .then(integration => res.status(200).send({ integration }))
    .catch(err => res.status(400).send(err));
});

// Edit integrations
router.put('/', (req, res) => {
  helpers.updateIntegration(req.body.integration, { returnedJSON: true })
    .then(integration => res.status(200).send({ integration }))
    .catch(err => res.status(400).send(err));
});

// Delete Integration
router.delete('/', (req, res) => {
  helpers.deleteIntegration({ integration: { id: req.query.id } })
    .then(() => res.status(200).send())
    .catch(error => res.status(400).send({ error }));
});

// Add location restriction to integration
router.post('/add-restriction', (req, res) => {
  helpers.addIntegrationRestriction(req.body)
    .then(() => res.status(200).send())
    .catch(error => res.status(400).send({ error }));
});

// Remove location restriction to integration
router.post('/remove-restriction', (req, res) => {
  helpers.removeIntegrationRestriction(req.body)
    .then(() => res.status(200).send())
    .catch(err => res.status(400).send(err));
});

/**
 * Enable/disable integration for org (check against location restrictions ensure its availabile)
 * @param {Object} organization - Organization Model
 * @param {Number} organization.id
 * @param {Object} integration - Integration Model
 * @param {Number} organization.id
 * @param {Boolean} organization.enabled - Desired status
 * @return {Object} Updated integration on 'integration' key
 */
router.post('/set-for-organization', (req, res) => {
  helpers.setForOrganization(req.body)
    .then(integration => res.status(200).send({ integration }))
    .catch(err => res.status(400).send(err));
});

module.exports = router;
