import { Router } from 'express';
import { knex } from '../orm';
import { Phone } from './models';
import { cleanPhoneFormating } from './helpers';

const router = new Router();

router.route('/')
  .get((req, res, next) => {
    const filters = {};
    if (req.query.phone_id) filters.id = req.query.phone_id;
    Phone.where(filters).fetchAll()
      .then((fetched) => {
        if (fetched) {
          res.status(200).send({ phones: fetched.toJSON() });
        } else {
          res.status(400).send();
        }
      }).catch(err => next(err));
  })
  .post((req, res, next) => {
    const phoneObj = cleanPhoneFormating(req.body.phone);
    Phone.forge({ ...phoneObj, organization_id: req.body.organization.id }).save(null, { method: 'insert' })
      .then((saved) => {
        res.status(200).send({ phone: saved.toJSON() });
      }).catch(err => next(err));
  })
  .put((req, res, next) => {
    const phoneObj = cleanPhoneFormating(req.body.phone);
    Phone.where({ id: req.body.phone.id }).save({
      ...phoneObj,
      updated_at: knex.raw('now()'),
    }, { method: 'update', patch: true })
    .then((updated) => {
      updated.refresh().then((refreshedPhone) => {
        res.status(200).send({ phone: refreshedPhone.toJSON() });
      });
    }).catch(err => next(err));
  })
  .delete((req, res, next) => {
    Phone.forge({ id: req.query.phone_id }).destroy()
      .then(() => {
        res.status(200).send({ phone: { id: req.query.id } });
      }).catch(err => next(err));
  });

module.exports = router;
