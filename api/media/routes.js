import { Router } from 'express';
import S3Router from 'react-s3-uploader/s3router';
import { logger } from '../logger';
import { saveMedia } from './helpers';

const router = new Router();

router.post('/', (req, res, next) => {
  logger.info('Endpoint: Save Media');
  try {
    const attachment = {
      type: req.body.type,
      url: req.body.url,
    };
    saveMedia(attachment, { returnJSON: true })
    .then(media => res.status(200).send({ media }))
    .catch(error => next(error));
  } catch (e) {
    next(e);
  }
});

router.use('/s3', S3Router({
  bucket: process.env.AWS_S3_BUCKET.concat('/uploads'),
  region: process.env.AWS_DEFAULT_REGION,
  uniquePrefix: true,
}));

module.exports = router;
