import request from 'request';
import * as constants from '../constants/interfaces'
import { logger } from '../logger';
import * as utils from '../utils/index';

export class SendInterface {

	constructor(config) {
		this.event = config.event;
		this.context = config.context;
	}

	sendTextMessage(recipientId, text) {
		var messageData = {
			recipient: {
				id: recipientId
			},
			message: {
				text: text
			}
		};
		this.callSendAPI(messageData);
	}

	/*
	 * Send an image using the Send API.
	 *
	 */
	sendImageMessage({ recipientId }) {
		var messageData = {
			recipient: {
				id: recipientId
			},
			message: {
				attachment: {
					type: 'image',
					payload: {
						url: process.env.AWS_S3_BUCKET_URL + '/assets/rift.png'
					}
				}
			}
		};
		this.callSendAPI(messageData);
	}

	/*
	 * Send a Gif using the Send API.
	 *
	 */
	sendGifMessage({ recipientId }) {
		var messageData = {
			recipient: {
				id: recipientId
			},
			message: {
				attachment: {
					type: 'image',
					payload: {
						url: process.env.AWS_S3_BUCKET_URL + '/assets/instagram_logo.gif'
					}
				}
			}
		};

		this.callSendAPI(messageData);
	}

	/*
	 * Send audio using the Send API.
	 *
	 */
	sendAudioMessage({ recipientId }) {
		var messageData = {
			recipient: {
				id: recipientId
			},
			message: {
				attachment: {
					type: 'audio',
					payload: {
						url: process.env.AWS_S3_BUCKET_URL + '/assets/sample.mp3'
					}
				}
			}
		};
		this.callSendAPI(messageData);
	}

	/*
	 * Send a video using the Send API.
	 * example videoName: "/assets/allofus480.mov"
	 */
	sendVideoMessage({ recipientId, videoName }) {
		var messageData = {
			recipient: {
				id: recipientId
			},
			message: {
				attachment: {
					type: 'video',
					payload: {
						url: process.env.AWS_S3_BUCKET_URL + videoName
					}
				}
			}
		};
		this.callSendAPI(messageData);
	}

	/*
	 * Send a video using the Send API.
	 * example fileName: fileName"/assets/test.txt"
	 */
	sendFileMessage({ recipientId, fileName }) {
		var messageData = {
			recipient: {
				id: recipientId
			},
			message: {
				attachment: {
					type: 'file',
					payload: {
						url: process.env.AWS_S3_BUCKET_URL + fileName
					}
				}
			}
		};
		this.callSendAPI(messageData);
	}



	/*
	 * Send a button message using the Send API.
	 *
	 */
	sendButtonMessage({ recipientId, text, buttons }) {
		var messageData = {
			recipient: {
				id: recipientId
			},
			message: {
				attachment: {
					type: 'template',
					payload: {
						template_type: 'button',
						text: text,
						buttons: buttons
					}
				}
			}
		};
		this.callSendAPI(messageData);
	}

	/*
	 * Send a Structured Message (Generic Message type) using the Send API.
	 * elements example:
	 * [{
	 * title: "rift",
	 * subtitle: "Next-generation virtual reality",
	 * item_url: "https://www.oculus.com/en-us/rift/",
	 * image_url: process.env.AWS_S3_BUCKET_URL + "/assets/rift.png",
	 * buttons: [{
	 * type: "web_url",
	 * url: "https://www.oculus.com/en-us/rift/",
	 * title: "Open Web URL"
	 * }, {
	 * type: "postback",
	 * title: "Call Postback",
	 * payload: "Payload for first bubble",
	 * }],
	 * }, {
	 * title: "touch",
	 * subtitle: "Your Hands, Now in VR",
	 * item_url: "https://www.oculus.com/en-us/touch/",
	 * image_url: process.env.AWS_S3_BUCKET_URL + "/assets/touch.png",
	 * buttons: [{
	 * type: "web_url",
	 * url: "https://www.oculus.com/en-us/touch/",
	 * title: "Open Web URL"
	 * }, {
	 * type: "postback",
	 * title: "Call Postback",
	 * payload: "Payload for second bubble",
	 * }]
	 * }]
	 *
	 *
	 * OR
	 *
	 * [
	 *  {
	 * "title": "Classic White T-Shirt",
	 * "subtitle": "Soft white cotton t-shirt is back in style",
	 * "item_url": "https://petersapparel.parseapp.com/view_item?item_id=100",
	 * "image_url": "http://petersapparel.parseapp.com/img/item100-thumb.png",
	 * "buttons": [
	 *  {
	 * "type": "web_url",
	 * "url": "https://petersapparel.parseapp.com/view_item?item_id=100",
	 * "title": "View Item"
	 * },
	 * {
	 * "type": "web_url",
	 * "url": "https://petersapparel.parseapp.com/buy_item?item_id=100",
	 * "title": "Buy Item"
	 * },
	 * {
	 * "type": "postback",
	 * "title": "Bookmark Item",
	 * "payload": "USER_DEFINED_PAYLOAD_FOR_ITEM100"
	 * }
	 * ]
	 * },
	 * {
	 * "title": "Classic Grey T-Shirt",
	 * "subtitle": "Soft gray cotton t-shirt is back in style",
	 * "image_url": "http://petersapparel.parseapp.com/img/item101-thumb.png",
	 * "item_url": "https://petersapparel.parseapp.com/view_item?item_id=101",
	 * "buttons": [
	 * {
	 * "type": "web_url",
	 * "url": "https://petersapparel.parseapp.com/view_item?item_id=101",
	 * "title": "View Item"
	 * },
	 * {
	 * "type": "web_url",
	 * "url": "https://petersapparel.parseapp.com/buy_item?item_id=101",
	 * "title": "Buy Item"
	 * },
	 * {
	 * "type": "postback",
	 * "title": "Bookmark Item",
	 * "payload": "USER_DEFINED_PAYLOAD_FOR_ITEM101"
	 * }
	 * ]
	 * }
	 * ]
	 *
	 */
	sendGenericMessage({ recipientId, elements }) {
		var messageData = {
			recipient: {
				id: recipientId
			},
			message: {
				attachment: {
					type: 'template',
					payload: {
						template_type: 'generic',
						elements: elements
					}
				}
			}
		};
		this.callSendAPI(messageData);
	}

	/*
	 * Send a receipt message using the Send API.
	 * example:
	 * 	recipient_name: "Peter Chang",
	 * 	currency: "USD",
	 * 	payment_method: "Visa 1234",
	 * 	timestamp: "1428444852",
	 * 	elements: [{
	 * 	title: "Oculus Rift",
	 * 	subtitle: "Includes: headset, sensor, remote",
	 * 	quantity: 1,
	 * 	price: 599.00,
	 * 	currency: "USD",
	 * 	image_url: process.env.AWS_S3_BUCKET_URL + "/assets/riftsq.png"
	 * 	}, {
	 * 	title: "Samsung Gear VR",
	 * 	subtitle: "Frost White",
	 * 	quantity: 1,
	 * 	price: 99.99,
	 * 	currency: "USD",
	 * 	image_url: process.env.AWS_S3_BUCKET_URL + "/assets/gearvrsq.png"
	 * 	}],
	 * 	address: {
	 * 	street_1: "1 Hacker Way",
	 * 	street_2: "",
	 * 	city: "Menlo Park",
	 * 	postal_code: "94025",
	 * 	state: "CA",
	 * 	country: "US"
	 * 	},
	 * 	summary: {
	 * 	subtotal: 698.99,
	 * 	shipping_cost: 20.00,
	 * 	total_tax: 57.67,
	 * 	total_cost: 626.66
	 * 	},
	 * 	adjustments: [{
	 * 	name: "New Customer Discount",
	 * 	amount: -50
	 * 	}, {
	 * 	name: "$100 Off Coupon",
	 * 	amount: -100
	 * 	}]
	 */
	sendReceiptMessage({ recipientId, recipient_name, currency, payment_method,
								timestamp, elements, address, summary, adjustments }) {
		// Generate a random receipt ID as the API requires a unique ID
		var receiptId = 'order' + Math.floor(Math.random() * 1000);

		var messageData = {
			recipient: {
				id: recipientId
			},
			message: {
				attachment: {
					type: 'template',
					payload: {
						template_type: 'receipt',
						recipient_name: recipient_name,
						order_number: receiptId,
						currency: currency,
						payment_method: payment_method,
						timestamp: timestamp,
						elements: elements,
						address: address,
						summary: summary,
						adjustments: adjustments
					}
				}
			}
		};
		this.callSendAPI(messageData);
	}

	/*
	 * Send a message with Quick Reply buttons.
	 *
	 */
	sendQuickReply({ recipientId, text, replies, metadata }) {

		let acceptedSources = [constants.FACEBOOK];

		if (acceptedSources.includes(this.context.source)) {
			var messageData = {
				recipient: {
					id: recipientId
				},
				message: {
					text: text,
					metadata: utils.isDefined(metadata) ? metadata : '',
					quick_replies: replies
				}
			};
			this.callSendAPI(messageData);
		}
	}

	/*
	 * Send a read receipt to indicate the message has been read
	 *
	 */
	sendReadReceipt({ recipientId }) {
		logger.info('Sending a read receipt to mark message as seen');

		var messageData = {
			recipient: {
				id: recipientId
			},
			sender_action: 'mark_seen'
		};
		this.callSendAPI(messageData);
	}

	/*
	 * Turn typing indicator on
	 *
	 */
	sendTypingOn({ recipientId }) {
		logger.info('Turning typing indicator on');

		let acceptedSources = [constants.FACEBOOK];

		if (acceptedSources.includes(this.context.source)) {
			var messageData = {
				recipient: {
					id: recipientId
				},
				sender_action: 'typing_on'
			};
			this.callSendAPI(messageData);
		}
	}

	/*
	 * Turn typing indicator off
	 *
	 */
	sendTypingOff({ recipientId }) {
		logger.info('Turning typing indicator off');

		let acceptedSources = [constants.FACEBOOK];

		if (acceptedSources.includes(this.context.source)) {
			var messageData = {
				recipient: {
					id: recipientId
				},
				sender_action: 'typing_off'
			};
			this.callSendAPI(messageData);
		}
	}

	/*
	 * Send a message with the account linking call-to-action
	 *
	 */
	sendAccountLinking({ recipientId }) {
		var messageData = {
			recipient: {
				id: recipientId
			},
			message: {
				attachment: {
					type: 'template',
					payload: {
						template_type: 'button',
						text: 'Welcome. Link your account.',
						buttons: [{
							type: 'account_link',
							url: process.env.SERVER_URL + '/authorize'
	          }]
					}
				}
			}
		};
		this.callSendAPI(messageData);
	}


	greetUserText({ userId }) {
		//first read user firstname
		request({
			uri: 'https://graph.facebook.com/v2.7/' + userId,
			qs: {
				access_token: process.env.FB_PAGE_TOKEN
			}

		}, function (error, response, body) {
			if (!error && response.statusCode == 200) {

				var user = JSON.parse(body);
				logger.info('getUserData:' + user);
				if (user.first_name) {
					logger.info('FB user: %s %s, %s',
						user.first_name, user.last_name, user.gender);

					this.sendTextMessage(userId, `Welcome ${user.first_name}! I can answer frequently asked questions for you and I perform job interviews. What can I help you with?`);
				} else {
					logger.info('Cannot get data for fb user with id',
						userId);
				}
			} else {
				logger.error(response.error);
			}
		});
	}

	/*
	 * Call the Send API. The message data goes in the body. If successful, we'll
	 * get the message id in a response
	 *
	 */
	callSendAPI(messageData) {
		// Setup DB

		// If Facebook, ping their webhook
		if (this.context.source === constants.FACEBOOK) {
			request({
				uri: 'https://graph.facebook.com/v2.6/me/messages',
				qs: {
					access_token: process.env.FB_PAGE_TOKEN
				},
				method: 'POST',
				json: messageData

			}, (error, response, body) => {
				if (!error && response.statusCode == 200) {
					var recipientId = body.recipient_id;
					var messageId = body.message_id;

					if (messageId) {
						logger.info('Successfully sent message with id %s to recipient %s',
							messageId, recipientId);
					} else {
						logger.info('Successfully called Send API for recipient %s',
							recipientId);
					}
				} else {
					logger.error('Failed calling Send API', response.statusCode, response.statusMessage, body.error);
				}
			});
			this.context.res.status(200).send();
		// If not Facebook, we'll do a bunch of sttuf but just respond for now
		} else if (this.context.source === constants.WEB) {
				this.context.res.status(200).send(messageData);
		}

	}

}
