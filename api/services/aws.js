import AWS from 'aws-sdk';
import Jimp from 'jimp';
import { PRODUCTION } from '../constants/environments';

export default class AWSHelper {
  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });
    this.bucket = process.env.NODE_ENV === PRODUCTION ? process.env.AWS_S3_BUCKET : `${process.env.AWS_S3_BUCKET}/dev`;
  }
  copyExternalUrlToS3(url, directory) {
    const self = this;
    return new Promise((resolve, reject) => {
      Jimp.read(url).then((image) => {
        image.quality(60).getBuffer(Jimp.MIME_PNG, (err, buffer) => {
          const placement = directory ? self.bucket.concat(`/${directory}`) : self.bucket.concat('/uploads');
          self.s3.upload({
            ACL: 'public-read',
            Bucket: placement,
            Key: /[^/]+$/i.exec(url)[0],
            ContentType: image._originalMime,
            Body: buffer,
          }, (s3Error, data) => {
            if (s3Error) reject(s3Error);
            resolve(data.Location);
          });
        });
      });
    });
  }
}
