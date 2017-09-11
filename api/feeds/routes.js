import { Router } from 'express';
import { Feed } from './models';
import { runFeed } from './helpers';

const router = new Router();

router.route('/')
  .get((req, res, next) => {
    const filters = {};
    if (req.query.feed_id) filters.id = req.query.feed_id;
    Feed.where(filters).fetchAll({ withRelated: [] })
      .then((fetched) => {
        if (fetched) {
          res.status(200).send({ feeds: fetched.toJSON() });
        } else {
          res.status(400).send();
        }
      }).catch(err => next(err));
  })
  .post((req, res, next) => {
    Feed.forge({ ...req.body.feed, organization_id: req.body.organization.id }).save(null, { method: 'insert' })
      .then((saved) => {
        res.status(200).send({ feed: saved.toJSON() });
      }).catch(err => next(err));
  })
  .put((req, res, next) => {
    Feed.where({ id: req.body.feed.id }).save(req.body.feed, { method: 'update', patch: true })
      .then((updated) => {
        updated.refresh().then((refreshedFeed) => {
          res.status(200).send({ feed: refreshedFeed.toJSON() });
        });
      }).catch(err => next(err));
  })
  .delete((req, res, next) => {
    Feed.forge({ id: req.query.feed_id }).destroy()
      .then(() => {
        res.status(200).send({ feed: { id: req.query.id } });
      }).catch(err => next(err));
  });

router.get('/run', (req, res, next) => {
  runFeed({ id: req.query.feed_id }).then((data) => {
    res.status(200).send(data);
  }).catch(err => next(err));
});

module.exports = router;
