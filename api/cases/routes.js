import { Router } from 'express';
import { logger } from '../logger';
import * as helpers from './helpers';
import { getOrInsertConstituent } from '../accounts/helpers';
import geocoder from '../services/geocoder';
import { requireAuth } from '../services/passport';

const router = new Router();

router.route('/')
  .get(requireAuth, (req, res, next) => {
    try {
      const orgId = req.query.organization_id;
      const options = {
        returnJSON: true,
      };
      options.limit = req.query.limit;
      options.offset = req.query.offset;
      options.filters = {};
      if (req.query.status) options.filters.status = req.query.status;
      helpers.getCases(orgId, options)
        .then(cases => res.status(200).send({ cases }))
        .catch(error => next(error));
    } catch (e) {
      next(e);
    }
  })
  .post(requireAuth, (req, res, next) => {
    try {
      getOrInsertConstituent(req.body.constituent, { returnJSON: true }).then((constituentJSON) => {
        if (typeof req.body.case.location === 'string') {
          geocoder(req.body.case.location).then((geoJSON) => {
            req.body.case.location = geoJSON.length > 0 ? geoJSON[0] : null;
            helpers.compileCase(req.body.case, constituentJSON, req.body.organization)
              .then(caseJSON => res.status(200).send({ case: caseJSON }))
              .catch(error => next(error));
          });
        } else {
          helpers.compileCase(req.body.caseModel, constituentJSON, req.body.organization)
            .then(caseJSON => res.status(200).send({ case: caseJSON }))
            .catch(error => next(error));
        }
      }).catch(error => next(error));
    } catch (e) {
      next(e);
    }
  });

router.get('/categories', (req, res, next) => {
  try {
    helpers.getCaseCategories(null, { returnJSON: true })
      .then(categories => res.status(200).send({ categories }))
      .catch(error => next(error));
  } catch (e) {
    next(e);
  }
});

router.put('/update_status', requireAuth, (req, res, next) => {
  try {
    const caseId = req.body.case.id;
    const status = req.body.status;
    const silent = req.body.silent;
    const response = req.body.response;
    helpers.updateCaseStatus(caseId, { response, status, silent }, { returnJSON: true })
      .then(data => res.status(200).send({ case: data }))
      .catch(error => next(error));
  } catch (e) {
    next(e);
  }
});

router.post('/webhook/email', (req, res) => {
  logger.info('Case Email Webhook Pinged');
  helpers.webhookHitWithEmail(req);
  res.status(200).send();
});

router.post('/webhook/event', (req, res) => {
  logger.info('Case Event Webhook Pinged');
  helpers.webhookEmailEvent(req);
  res.status(200).send();
});

module.exports = router;
