import { Router } from 'express';
import { Feed } from './models';

const router = new Router();

function formattedFeedObj(bodyFeed) {
  const cleanObj = bodyFeed;
  if (cleanObj.format !== 'twitter') {
    cleanObj.watcher = false;
    delete cleanObj.config.twitter_handle;
  }
  if (cleanObj.format !== 'ics' && cleanObj.format !== 'rss') delete cleanObj.config.url;
  if (cleanObj.format !== 'scraped') cleanObj.script = null;
  return cleanObj;
}

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
    Feed.forge({ ...formattedFeedObj(req.body.feed), organization_id: req.body.organization.id }).save(null, { method: 'insert' })
      .then((saved) => {
        res.status(200).send({ feed: saved.toJSON() });
      }).catch(err => next(err));
  })
  .put((req, res, next) => {
    Feed.where({ id: req.body.feed.id }).save({ ...formattedFeedObj(req.body.feed), organization_id: req.body.feed.organization_id || req.body.organization.id }, { method: 'update', patch: true })
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

module.exports = router;
