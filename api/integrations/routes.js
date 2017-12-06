import { Router } from 'express';
import * as helpers from './helpers';
import { requireAuth } from '../utils/passport';

const router = Router();

router.route('/')
  .get((req, res) => {
    helpers.getIntegrations({
      organization: { id: req.query.organization_id },
    }).then(integrations => res.status(200).send({ integrations }))
      .catch(err => res.status(400).send(err));
  })
  .post(requireAuth, (req, res) => {
    helpers.createIntegration(req.body.integration, { returnedJSON: true })
      .then(integration => res.status(200).send({ integration }))
      .catch(err => res.status(400).send(err));
  })
  .put((req, res) => {
    helpers.updateIntegration(req.body.integration, { returnedJSON: true })
      .then(integration => res.status(200).send({ integration }))
      .catch(err => res.status(400).send(err));
  })
  .delete(requireAuth, (req, res) => {
    helpers.deleteIntegration({ integration: { id: req.query.id } })
      .then(() => res.status(200).send())
      .catch(error => res.status(400).send({ error }));
  });

module.exports = router;
