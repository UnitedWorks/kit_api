import S3Router from 'react-s3-uploader/s3router';
import { Router } from 'express';
import { knex } from '../orm';
import { logger } from '../logger';
import { PRODUCTION } from '../constants/environments';
import { saveMedia } from './helpers';
import { Media } from './models';

const router = new Router();

router.route('/')
  .get((req, res, next) => {
    const filters = {};
    if (req.query.media_id) filters.id = req.query.media_id;
    if (req.query.organization_id) filters.organization_id = req.query.organization_id;
    Media.where(filters).fetchAll()
      .then((fetched) => {
        if (fetched) {
          res.status(200).send({ media: fetched.toJSON() });
        } else {
          res.status(400).send();
        }
      }).catch(err => next(err));
  })
  .post((req, res, next) => {
    logger.info('Endpoint: Save Media');
    try {
      saveMedia(req.body, { returnJSON: true })
        .then(media => res.status(200).send({ media }))
        .catch(error => next(error));
    } catch (e) {
      next(e);
    }
  })
  .put((req, res, next) => {
    Media.forge(req.body.media).save(null, { method: 'update' })
      .then(() => res.status(200).send())
      .catch(err => next(err));
  })
  .delete((req, res, next) => {
    return Promise.all([
      knex('knowledge_answers').where({ media_id: req.query.media_id }).del().then(d => d),
      knex('resources_medias').where({ media_id: req.query.media_id }).del().then(d => d),
    ]).then(() => {
      Media.forge({ id: req.query.media_id }).destroy()
        .then(() => res.status(200).send())
        .catch(err => next(err));
    })
  });

router.use('/s3', S3Router({
  bucket: process.env.NODE_ENV === PRODUCTION ? `${process.env.AWS_S3_BUCKET}/uploads` : `${process.env.AWS_S3_BUCKET}/dev`,
  region: process.env.AWS_DEFAULT_REGION,
  uniquePrefix: true,
}));

module.exports = router;
