import uuid from 'uuid';
import { logger } from '../logger';
import { events, sessionIds } from './index';
import { NLPService } from '../services/nlp';

export class ConversationMessage {
	constructor(options) {
		this.event = options.event;
		this.context = options.context;

		if (this.event.optin) {
			this.receivedAuthentication(this.event);
		} else if (this.event.message) {
			this.receivedMessage(this.event);
		} else if (this.event.delivery) {
			this.receivedDeliveryConfirmation(this.event);
		} else if (this.event.postback) {
			this.receivedPostback(this.event);
		} else if (this.event.read) {
			this.receivedMessageRead(this.event);
		} else if (this.event.account_linking) {
			this.receivedAccountLink(this.event);
		} else {
			logger.info("Unknown messagingEvent: ", this.event);
		}
	}

	get () {
		return {
			context: this.context,
			event: this.event,
			message: this.messageData,
		};
	}

	receivedMessage(event) {
		var senderID = event.sender.id;
		var recipientID = event.recipient.id;
		var timeOfMessage = event.timestamp;
		var message = event.message;
		if (!sessionIds.has(senderID)) {
			sessionIds.set(senderID, uuid.v1());
		}
		logger.info("Received message for user %d and page %d at %d with message:",
			senderID, recipientID, timeOfMessage, message);
		logger.info(JSON.stringify(message));
		var isEcho = message.is_echo;
		var messageId = message.mid;
		var appId = message.app_id;
		var metadata = message.metadata;
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
			new NLPService({
				event: this.event,
				context: this.context,
			}).evaluate({
				senderID: senderID,
				text: messageText,
				handleResponse: true,
			})
		} else if (messageAttachments) {
			handleMessageAttachments(messageAttachments, senderID);
		}
	}

	receivedPostback(event) {
		var senderID = event.sender.id;
		var recipientID = event.recipient.id;
		var timeOfPostback = event.timestamp;
		var payload = event.postback.payload;

		switch (payload) {
			case 'GET_STARTED':
				events.send.greetUserText(senderID);
				break;
			case 'JOB_APPLY':
				//get feedback with new jobs
				new NLPService({
					event: event,
					context: this.context,
				}).evaluate({
					senderID: senderID,
					text: 'job openings',
					handleResponse: true,
				})
				break;
			case 'CHAT':
				//user wants to chat
				events.send.sendTextMessage(senderID, 'I love chatting too. Do you have any other questions for me?');
				break;
			default:
				//unindentified payload
				events.send.sendTextMessage(senderID, "I'm not sure what you want. Can you be more specific?");
				break;
		}
		logger.info('payload' + payload);
		logger.info("Received postback for user %d and page %d with payload '%s' " +
			'at %d', senderID, recipientID, payload, timeOfPostback);
	}

	receivedMessageRead(event) {
		var senderID = event.sender.id;
		var recipientID = event.recipient.id;
		var watermark = event.read.watermark;
		var sequenceNumber = event.read.seq;
		logger.info('Received message read event for watermark %d and sequence ' +
			'number %d', watermark, sequenceNumber);
	}

	receivedAccountLink(event) {
		var senderID = event.sender.id;
		var recipientID = event.recipient.id;
		var status = event.account_linking.status;
		var authCode = event.account_linking.authorization_code;
		logger.info('Received account link event with for user %d with status %s ' +
			'and auth code %s ', senderID, status, authCode);
	}

	receivedDeliveryConfirmation(event) {
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

	receivedAuthentication(event) {
		var senderID = event.sender.id;
		var recipientID = event.recipient.id;
		var timeOfAuth = event.timestamp;
		var passThroughParam = event.optin.ref;
		logger.info('Received authentication for user %d and page %d with pass ' +
			"through param '%s' at %d", senderID, recipientID, passThroughParam,
			timeOfAuth);
		events.send.sendTextMessage(senderID, 'Authentication successful');
	}

	handleEcho(messageId, appId, metadata) {
		logger.info('Received echo for message %s and app %d with metadata %s', event.messageId, event.appId, event.metadata);
	}

	handleMessageAttachments(messageAttachments, senderID) {
		events.send.sendTextMessage(senderID, "Attachment received. Thank you.");
	}

	handleQuickReply(senderID, quickReply, messageId) {
		var quickReplyPayload = quickReply.payload;
		logger.info("Quick reply for message %s with payload %s", messageId, quickReplyPayload);

		new NLPService({
			context: this.context,
			event: this.event,
		}).evaluate({
			senderID: senderID,
			text: quickReplyPayload,
			handleResponse: true,
		})
	}


}
