import AWS from 'aws-sdk';
import axios from 'axios';
import { PRODUCTION } from '../constants/environments';

export default class AWSHelper {
  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });
    this.bucket = process.env.NODE_ENV === PRODUCTION ? `${process.env.AWS_S3_BUCKET}/uploads` : `${process.env.AWS_S3_BUCKET}/dev`;
  }
  copyExternalUrlToS3(url, directory) {
    const self = this;
    return new Promise((resolve, reject) => {
      axios.get(url, {
        responseType: 'arraybuffer',
      }).then((response) => {
        const placement = directory ? self.bucket.concat(`/${directory}`) : self.bucket.concat('/uploads');
        self.s3.upload({
          ACL: 'public-read',
          Bucket: placement,
          Key: /[^/]+$/i.exec(url)[0],
          ContentEncoding: 'utf8',
          ContentType: response.headers['content-type'],
          Body: new Buffer(response.data, 'binary'),
        }, (s3Error, data) => {
          if (s3Error) reject(s3Error);
          resolve(data.Location);
        });
      });
    });
  }
}
