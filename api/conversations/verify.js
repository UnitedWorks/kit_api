import crypto from 'crypto';
import { logger } from '../logger';
import * as utils from '../utils/index';
import * as environments from '../constants/environments';

/*
 * Verify that the callback came from Facebook. Using the App Secret from
 * the App Dashboard, we can verify the signature that is sent with each
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
export function verifyRequestSignature(req, res, buf) {
  const origin = utils.getOrigin(req.headers.origin);
  if (origin === environments.LOCAL || origin === environments.PRODUCTION) {
    // If on local testing with postman, a local dashboard, or website, bypass.
  } else {
    // If hit by Facebook
    const signature = req.headers['x-hub-signature'];
    if (!signature) {
      throw new Error('Couldn\'t validate the signature.');
    } else {
      const elements = signature.split('=');
      const signatureHash = elements[1];
      const expectedHash = crypto.createHmac('sha1', process.env.FB_APP_SECRET)
        .update(buf)
        .digest('hex');
      if (signatureHash != expectedHash) {
        throw new Error("Couldn't validate the request signature.");
      }
    }
  }
}

export function webhookVerificationFacebook(req, res) {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.FB_VERIFY_TOKEN) {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    logger.error('Failed validation. Make sure the validation tokens match.');
    res.status(403).send();
  }
}
