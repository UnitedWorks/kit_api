import request from 'request';
import { logger } from '../logger';
import * as utils from '../utils/index';

export function sendTextMessage(recipientId, text) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			text: text
		}
	}
	callSendAPI(messageData);
}

/*
 * Send an image using the Send API.
 *
 */
export function sendImageMessage(recipientId) {
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

	callSendAPI(messageData);
}

/*
 * Send a Gif using the Send API.
 *
 */
export function sendGifMessage(recipientId) {
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

	callSendAPI(messageData);
}

/*
 * Send audio using the Send API.
 *
 */
export function sendAudioMessage(recipientId) {
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

	callSendAPI(messageData);
}

/*
 * Send a video using the Send API.
 * example videoName: "/assets/allofus480.mov"
 */
export function sendVideoMessage(recipientId, videoName) {
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

	callSendAPI(messageData);
}

/*
 * Send a video using the Send API.
 * example fileName: fileName"/assets/test.txt"
 */
export function sendFileMessage(recipientId, fileName) {
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

	callSendAPI(messageData);
}



/*
 * Send a button message using the Send API.
 *
 */
export function sendButtonMessage(recipientId, text, buttons) {
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

	callSendAPI(messageData);
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
export function sendGenericMessage(recipientId, elements) {
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

	callSendAPI(messageData);
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
export function sendReceiptMessage(recipientId, recipient_name, currency, payment_method,
							timestamp, elements, address, summary, adjustments) {
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

	callSendAPI(messageData);
}

/*
 * Send a message with Quick Reply buttons.
 *
 */
export function sendQuickReply(recipientId, text, replies, metadata) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			text: text,
			metadata: utils.isDefined(metadata)?metadata:'',
			quick_replies: replies
		}
	};

	callSendAPI(messageData);
}

/*
 * Send a read receipt to indicate the message has been read
 *
 */
export function sendReadReceipt(recipientId) {
	logger.info('Sending a read receipt to mark message as seen');

	var messageData = {
		recipient: {
			id: recipientId
		},
		sender_action: 'mark_seen'
	};

	callSendAPI(messageData);
}

/*
 * Turn typing indicator on
 *
 */
export function sendTypingOn(recipientId) {
	logger.info('Turning typing indicator on');

	var messageData = {
		recipient: {
			id: recipientId
		},
		sender_action: 'typing_on'
	};

	callSendAPI(messageData);
}

/*
 * Turn typing indicator off
 *
 */
export function sendTypingOff(recipientId) {
	logger.info('Turning typing indicator off');

	var messageData = {
		recipient: {
			id: recipientId
		},
		sender_action: 'typing_off'
	};

	callSendAPI(messageData);
}

/*
 * Send a message with the account linking call-to-action
 *
 */
export function sendAccountLinking(recipientId) {
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

	callSendAPI(messageData);
}


export function greetUserText(userId) {
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

				sendTextMessage(userId, 'Welcome ' + user.first_name + '! ' +
				'I can answer frequently asked questions for you ' +
				'and I perform job interviews. What can I help you with?');
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
export function callSendAPI(messageData) {
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
}
