import { Router } from 'express';
import { Constituent, Representative, Organization } from './models';
import * as helpers from './helpers';

const router = new Router();

// Organizations
router.get('/organizations', (req, res) => {
  Organization.fetchAll({ withRelated: ['location', 'narrativeSources'] }).then((orgs) => {
    res.status(200).send(orgs);
  });
});

router.post('/organizations/add-representative', (req, res) => {
  helpers.addRepToOrganization(req.body.representative, req.body.organization)
    .then(response => res.status(200).send(response))
    .catch(err => res.status(400).send(err));
});

// Representatives
router.get('/representative', (req, res) => {
  Representative.where(req.query).fetchOne().then((reps) => {
    res.status(200).send(reps);
  });
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
