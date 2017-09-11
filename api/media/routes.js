import { Router } from 'express';
import S3Router from 'react-s3-uploader/s3router';
import { logger } from '../logger';
import { saveMedia } from './helpers';
import { PRODUCTION } from '../constants/environments';
import { Media } from './models';

const router = new Router();

router.get('/', (req, res, next) => {
  const filters = {};
  if (req.query.media_id) filters.id = req.query.media_id;
  if (req.query.organization_id) filters.organization_id = req.query.organization_id;
  Media.where(filters).fetchAll({ withRelated: [] })
    .then((fetched) => {
      if (fetched) {
        res.status(200).send({ media: fetched.toJSON() });
      } else {
        res.status(400).send();
      }
    }).catch(err => next(err));
});

router.post('/', (req, res, next) => {
  logger.info('Endpoint: Save Media');
  try {
    saveMedia(req.body, { returnJSON: true })
      .then(media => res.status(200).send({ media }))
      .catch(error => next(error));
  } catch (e) {
    next(e);
  }
});

router.use('/s3', S3Router({
  bucket: process.env.NODE_ENV === PRODUCTION ? `${process.env.AWS_S3_BUCKET}/uploads` : `${process.env.AWS_S3_BUCKET}/dev`,
  region: process.env.AWS_DEFAULT_REGION,
  uniquePrefix: true,
}));

module.exports = router;
