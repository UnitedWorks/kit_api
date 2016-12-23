import * as constants from '../constants/interfaces'
import crypto from 'crypto';
import { logger } from '../logger';
import { events } from './index';
import { ConversationMessage } from './receive'

/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page.
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
export function webhookHitWithMessage(req, res) {

	if (req.body.extendedContext.source == constants.FACEBOOK) {
		bodyParser.json({verify: conversations.events.helpers.verifyRequestSignature});
	}

	context = req.body.extendedContext;
	context.req = req;
	context.res = res;

	const data = req.body;
	logger.info(JSON.stringify(data));

	// Iterate over each entry
	// There may be multiple if batched
	data.entry.forEach((pageEntry) => {
		// Iterate over each messaging event
		pageEntry.messaging.forEach((messagingEvent) => {
			new ConversationMessage({
				context: context,
				event: messagingEvent,
			}).exec();
		});
	});

	// You must send back a 200, within 20 seconds
	res.sendStatus(200);
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
	var signature = req.headers['x-hub-signature'];

	if (!signature) {
		throw new Error('Couldn\'t validate the signature.');
	} else {
		var elements = signature.split('=');
		var method = elements[0];
		var signatureHash = elements[1];

		var expectedHash = crypto.createHmac('sha1', process.env.FB_APP_SECRET)
			.update(buf)
			.digest('hex');

		if (signatureHash != expectedHash) {
			throw new Error("Couldn't validate the request signature.");
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
