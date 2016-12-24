import * as interfaces from '../constants/interfaces'
import * as environments from '../constants/environments'
import crypto from 'crypto';
import { logger } from '../logger';
import { events } from './index';
import { ConversationMessage } from './receive'

const bodyParser = require('body-parser');

/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page.
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
export function webhookHitWithMessage(req, res) {

	logger.info('Handle Message: ', req.body);

	const data = req.body;
	logger.info(JSON.stringify(data));

	let context = data.extendedContext;
	context.req = req;
	context.res = res;

	// Iterate over each entry
	// There may be multiple if batched
	data.entry.forEach((pageEntry) => {
		// Iterate over each messaging event
		pageEntry.messaging.forEach((messagingEvent) => {
			new ConversationMessage({
				context: context,
				event: messagingEvent,
			})
		});
	});

}

export function getOrigin(origin) {
	if (/chrome/.test(origin) || /localhost/.test(origin)) {
		return environments.LOCAL;
	} else if(/kit.community/.test(origin)) {
		return environments.PRODUCTION;
	} else {
		return interfaces.FACEBOOK;
	}
}

/*
 * Verify that the callback came from Facebook. Using the App Secret from
 * the App Dashboard, we can verify the signature that is sent with each
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
export function verifyRequestSignature(req, res, buf) {

	let origin = getOrigin(req.headers.origin);

	if (origin === environments.LOCAL || origin === environments.PRODUCTION) {
		// If on local testing with postman, a local dashboard, or website, bypass.
	} else {
		// If hit by Facebook
		let signature = req.headers['x-hub-signature'];
		if (!signature) {
			throw new Error('Couldn\'t validate the signature.');
		} else {
			let elements = signature.split('=');
			let method = elements[0];
			let signatureHash = elements[1];
			let expectedHash = crypto.createHmac('sha1', process.env.FB_APP_SECRET)
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
    res.sendStatus(403);
  }
};
