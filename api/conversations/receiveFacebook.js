import uuid from 'uuid';
import { logger } from '../logger';
import { interfaces, sessionIds} from './index';
import { services } from '../services/index';

export function receivedMessage(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var timeOfMessage = event.timestamp;
	var message = event.message;

	if (!sessionIds.has(senderID)) {
		sessionIds.set(senderID, uuid.v1());
	}

	logger.info("Received message for user %d and page %d at %d with message:",
		senderID, recipientID, timeOfMessage);
	logger.info(JSON.stringify(message));

	var isEcho = message.is_echo;
	var messageId = message.mid;
	var appId = message.app_id;
	var metadata = message.metadata;

	// You may get a text or attachment but not both
	var messageText = message.text;
	var messageAttachments = message.attachments;
	var quickReply = message.quick_reply;

	if (isEcho) {
		handleEcho(messageId, appId, metadata);
		return;
	} else if (quickReply) {
		handleQuickReply(senderID, quickReply, messageId);
		return;
	}


	if (messageText) {
		//send message to api.ai
		services.nlp.apiAi.sendToApiAi(senderID, messageText);
	} else if (messageAttachments) {
		handleMessageAttachments(messageAttachments, senderID);
	}
}

/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 *
 */
export function receivedPostback(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var timeOfPostback = event.timestamp;

	// The 'payload' param is a developer-defined field which is set in a postback
	// button for Structured Messages.
	var payload = event.postback.payload;

	switch (payload) {
		case 'GET_STARTED':
			interfaces.facebook.send.greetUserText(senderID);
			break;
		case 'JOB_APPLY':
			//get feedback with new jobs
			services.nlp.apiAi.sendToApiAi(senderID, 'job openings');
			break;
		case 'CHAT':
			//user wants to chat
			interfaces.facebook.send.sendTextMessage(senderID, 'I love chatting too. Do you have any other questions for me?');
			break;
		default:
			//unindentified payload
			interfaces.facebook.send.sendTextMessage(senderID, "I'm not sure what you want. Can you be more specific?");
			break;

	}
	logger.info('payload' + payload);
	logger.info("Received postback for user %d and page %d with payload '%s' " +
		'at %d', senderID, recipientID, payload, timeOfPostback);
}

/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 *
 */
export function receivedMessageRead(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;

	// All messages before watermark (a timestamp) or sequence have been seen.
	var watermark = event.read.watermark;
	var sequenceNumber = event.read.seq;

	logger.info('Received message read event for watermark %d and sequence ' +
		'number %d', watermark, sequenceNumber);
}

/*
 * Account Link Event
 *
 * This event is called when the Link Account or UnLink Account action has been
 * tapped.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
 *
 */
export function receivedAccountLink(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;

	var status = event.account_linking.status;
	var authCode = event.account_linking.authorization_code;

	logger.info('Received account link event with for user %d with status %s ' +
		'and auth code %s ', senderID, status, authCode);
}

/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
export function receivedDeliveryConfirmation(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var delivery = event.delivery;
	var messageIDs = delivery.mids;
	var watermark = delivery.watermark;
	var sequenceNumber = delivery.seq;

	if (messageIDs) {
		messageIDs.forEach(function (messageID) {
			logger.info('Received delivery confirmation for message ID: %s',
				messageID);
		});
	}

	logger.info('All message before %d were delivered.', watermark);
}

/*
 * Authorization Event
 *
 * The value for 'optin.ref' is defined in the entry point. For the "Send to
 * Messenger" plugin, it is the 'data-ref' field. Read more at
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
 *
 */
export function receivedAuthentication(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var timeOfAuth = event.timestamp;

	// The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
	// The developer can set this to an arbitrary value to associate the
	// authentication callback with the 'Send to Messenger' click event. This is
	// a way to do account linking when the user clicks the 'Send to Messenger'
	// plugin.
	var passThroughParam = event.optin.ref;

	logger.info('Received authentication for user %d and page %d with pass ' +
		"through param '%s' at %d", senderID, recipientID, passThroughParam,
		timeOfAuth);

	// When an authentication is received, we'll send a message back to the sender
	// to let them know it was successful.
	interfaces.facebook.send.sendTextMessage(senderID, 'Authentication successful');
}

//https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-echo
export function handleEcho(messageId, appId, metadata) {
	// Just logging message echoes to console
	logger.info('Received echo for message %s and app %d with metadata %s', messageId, appId, metadata);
}

export function handleMessageAttachments(messageAttachments, senderID){
	//for now just reply
	interfaces.facebook.send.sendTextMessage(senderID, "Attachment received. Thank you.");
}

export function handleQuickReply(senderID, quickReply, messageId) {
	var quickReplyPayload = quickReply.payload;
	logger.info("Quick reply for message %s with payload %s", messageId, quickReplyPayload);
	//send payload to api.ai
	services.nlp.apiAi.sendToApiAi(senderID, quickReplyPayload);
}
