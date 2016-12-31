import { Router } from 'express';
import { Constituent, Representative, Organization } from './models';

const router = new Router();

// Constituents
router.get('/constituents', (req, res) => {
  Constituent.fetchAll().then((cons) => {
    res.status(200).send(cons);
  });
});

// Representatives
router.post('/representative', (req, res) => {
  new Representative(req.body).save()
  .then((saved) => {
    res.status(200).send(saved);
  })
  .catch((err) => {
    res.status(400).send(err);
  });
});

router.get('/representatives', (req, res) => {
  Representative.fetchAll().then((reps) => {
    res.status(200).send(reps);
  });
});

// Organizations
router.post('/organization', (req, res) => {
  new Representative(req.body).save()
  .then((saved) => {
    res.status(200).send(saved);
  })
  .catch((err) => {
    res.status(400).send(err);
  });
});

router.get('/organizations', (req, res) => {
  Organization.fetchAll().then((orgs) => {
    res.status(200).send(orgs);
  });
});

module.exports = router;
