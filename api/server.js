import * as environment from './env';

const apiai = require('apiai');
const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
const uuid = require('uuid');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_DEFAULT_REGION
});

var logs = [];

app.set('port', (process.env.PORT || 5000))

//verify request came from facebook
app.use(bodyParser.json({
	verify: verifyRequestSignature
}));

//serve static files in the public directory
app.use(express.static('public'));

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
	extended: false
}))

// Process application/json
app.use(bodyParser.json())


const apiAiService = apiai(process.env.API_AI_CLIENT_ACCESS_TOKEN, {
	language: "en",
	requestSource: "fb"
});
const sessionIds = new Map();

// for Facebook verification
app.get('/conversations/webhook/', function (req, res) {
	console.log("request");
	if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.FB_VERIFY_TOKEN) {
		res.status(200).send(req.query['hub.challenge']);
	} else {
		console.error("Failed validation. Make sure the validation tokens match.");
		res.sendStatus(403);
	}
})

/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page.
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
app.post('/conversations/webhook/', function (req, res) {
	var data = req.body;
	console.log(JSON.stringify(data));



	// Make sure this is a page subscription
	if (data.object == 'page') {
		// Iterate over each entry
		// There may be multiple if batched
		data.entry.forEach(function (pageEntry) {
			var pageID = pageEntry.id;
			var timeOfEvent = pageEntry.time;

			// Iterate over each messaging event
			pageEntry.messaging.forEach(function (messagingEvent) {
				if (messagingEvent.optin) {
					receivedAuthentication(messagingEvent);
				} else if (messagingEvent.message) {
					receivedMessage(messagingEvent);
				} else if (messagingEvent.delivery) {
					receivedDeliveryConfirmation(messagingEvent);
				} else if (messagingEvent.postback) {
					receivedPostback(messagingEvent);
				} else if (messagingEvent.read) {
					receivedMessageRead(messagingEvent);
				} else if (messagingEvent.account_linking) {
					receivedAccountLink(messagingEvent);
				} else {
					console.log("Webhook received unknown messagingEvent: ", messagingEvent);
				}
			});
		});

		// Assume all went well.
		// You must send back a 200, within 20 seconds
		res.sendStatus(200);
	}
});





function receivedMessage(event) {

	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var timeOfMessage = event.timestamp;
	var message = event.message;

	if (!sessionIds.has(senderID)) {
		sessionIds.set(senderID, uuid.v1());
	}
	console.log("Received message for user %d and page %d at %d with message:",
		senderID, recipientID, timeOfMessage);
	console.log(JSON.stringify(message));

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
		sendToApiAi(senderID, messageText);
	} else if (messageAttachments) {
		handleMessageAttachments(messageAttachments, senderID);
	}
}


function handleMessageAttachments(messageAttachments, senderID){
	//for now just reply
	sendTextMessage(senderID, "Attachment received. Thank you.");
}

function handleQuickReply(senderID, quickReply, messageId) {
	var quickReplyPayload = quickReply.payload;
	console.log("Quick reply for message %s with payload %s", messageId, quickReplyPayload);
	//send payload to api.ai
	sendToApiAi(senderID, quickReplyPayload);
}

//https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-echo
function handleEcho(messageId, appId, metadata) {
	// Just logging message echoes to console
	console.log("Received echo for message %s and app %d with metadata %s", messageId, appId, metadata);
}

function handleApiAiAction(sender, action, responseText, contexts, parameters) {
  logs.push({
    sender,
    action,
    responseText,
    contexts,
    parameters
  });
	switch (action) {
		case "faq-delivery":
			sendTextMessage(sender, responseText);
			sendTypingOn(sender);

			//ask what user wants to do next
			setTimeout(function() {
				let buttons = [
					{
						type:"web_url",
						url:"https://www.myapple.com/track_order",
						title:"Track my order"
					},
					{
						type:"phone_number",
						title:"Call us",
						payload:"+16505551234",
					},
					{
						type:"postback",
						title:"Keep on Chatting",
						payload:"CHAT"
					}
				];

				sendButtonMessage(sender, "What would you like to do next?", buttons);
			}, 3000)

			break;
		case "detailed-application":
			if (isDefined(contexts[0]) && contexts[0].name == 'job_application' && contexts[0].parameters) {
				let phone_number = (isDefined(contexts[0].parameters['phone-number'])
				&& contexts[0].parameters['phone-number']!= '') ? contexts[0].parameters['phone-number'] : '';
				let user_name = (isDefined(contexts[0].parameters['user-name'])
				&& contexts[0].parameters['user-name']!= '') ? contexts[0].parameters['user-name'] : '';
				let previous_job = (isDefined(contexts[0].parameters['previous-job'])
				&& contexts[0].parameters['previous-job']!= '') ? contexts[0].parameters['previous-job'] : '';
				let years_of_experience = (isDefined(contexts[0].parameters['years-of-experience'])
				&& contexts[0].parameters['years-of-experience']!= '') ? contexts[0].parameters['years-of-experience'] : '';
				let job_vacancy = (isDefined(contexts[0].parameters['job-vacancy'])
				&& contexts[0].parameters['job-vacancy']!= '') ? contexts[0].parameters['job-vacancy'] : '';

				if (phone_number != '' && user_name != '' && previous_job != '' && years_of_experience != ''
				&& job_vacancy != '') {
					let emailContent = 'A new job enquiery from ' + user_name + ' for the job: ' + job_vacancy +
							'.<br> Previous job position: ' + previous_job + '.' +
							'.<br> Years of experience: ' + years_of_experience + '.' +
							'.<br> Phone number: ' + phone_number + '.';

					sendEmail('New job application', emailContent);
				}
			}
			sendTextMessage(sender, responseText);
			break;
		case "job-enquiry":
			let replies = [
				{
					"content_type":"text",
					"title":"Accountant",
					"payload":"Accountant"
				},
				{
					"content_type":"text",
					"title":"Sales",
					"payload":"Sales"
				},
				{
					"content_type":"text",
					"title":"Not interested",
					"payload":"Not interested"
				}
			];
			sendQuickReply(sender, responseText, replies);
			break;
		default:
			//unhandled action, just send back the text
			console.log("send responce in handle actiongit: " + responseText);
			sendTextMessage(sender, responseText);
	}
}

function handleApiAiResponse(sender, response) {
	let responseText = response.result.fulfillment.speech;
	let responseData = response.result.fulfillment.data;
	let action = response.result.action;
	let contexts = response.result.contexts;
	let parameters = response.result.parameters;

	console.log("responseText: " + responseText);
	console.log("responseData: " + responseData);
	console.log("action: " + action);
	sendTypingOff(sender);


	if (responseText == '' && !isDefined(action)) {
		//api ai could not evaluate input.
		console.log('Unknown query' + response.result.resolvedQuery);
		sendTextMessage(senderID, "I'm not sure what you want. Can you be more specific?");
	} else if (isDefined(action)) {
		handleApiAiAction(sender, action, responseText, contexts, parameters);
	} else if (isDefined(responseData) && isDefined(responseData.facebook)) {
		try {
			console.log('Response as formatted message' + responseData.facebook);
			sendTextMessage(sender, responseData.facebook);
		} catch (err) {
			sendTextMessage(sender, err.message);
		}
	} else if (isDefined(responseText)) {
		console.log('Respond as text message');
		sendTextMessage(sender, responseText);
	}
}

function sendToApiAi(sender, text) {
	console.log("sendToApiAi: " + text);
	sendTypingOn(sender);
	let apiaiRequest = apiAiService.textRequest(text, {
		sessionId: sessionIds.get(sender)
	});

	apiaiRequest.on('response', (response) => {
		if (isDefined(response.result)) {
			handleApiAiResponse(sender, response);
		}
	});

	apiaiRequest.on('error', (error) => console.error(error));
	apiaiRequest.end();
}




function sendTextMessage(recipientId, text) {
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
function sendImageMessage(recipientId) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "image",
				payload: {
					url: process.env.AWS_S3_BUCKET_URL + "/assets/rift.png"
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
function sendGifMessage(recipientId) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "image",
				payload: {
					url: process.env.AWS_S3_BUCKET_URL + "/assets/instagram_logo.gif"
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
function sendAudioMessage(recipientId) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "audio",
				payload: {
					url: process.env.AWS_S3_BUCKET_URL + "/assets/sample.mp3"
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
function sendVideoMessage(recipientId, videoName) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "video",
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
function sendFileMessage(recipientId, fileName) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "file",
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
function sendButtonMessage(recipientId, text, buttons) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "template",
				payload: {
					template_type: "button",
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
function sendGenericMessage(recipientId, elements) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "template",
				payload: {
					template_type: "generic",
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
function sendReceiptMessage(recipientId, recipient_name, currency, payment_method,
							timestamp, elements, address, summary, adjustments) {
	// Generate a random receipt ID as the API requires a unique ID
	var receiptId = "order" + Math.floor(Math.random() * 1000);

	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "template",
				payload: {
					template_type: "receipt",
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
function sendQuickReply(recipientId, text, replies, metadata) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			text: text,
			metadata: isDefined(metadata)?metadata:'',
			quick_replies: replies
		}
	};

	callSendAPI(messageData);
}

/*
 * Send a read receipt to indicate the message has been read
 *
 */
function sendReadReceipt(recipientId) {
	console.log("Sending a read receipt to mark message as seen");

	var messageData = {
		recipient: {
			id: recipientId
		},
		sender_action: "mark_seen"
	};

	callSendAPI(messageData);
}

/*
 * Turn typing indicator on
 *
 */
function sendTypingOn(recipientId) {
	console.log("Turning typing indicator on");

	var messageData = {
		recipient: {
			id: recipientId
		},
		sender_action: "typing_on"
	};

	callSendAPI(messageData);
}

/*
 * Turn typing indicator off
 *
 */
function sendTypingOff(recipientId) {
	console.log("Turning typing indicator off");

	var messageData = {
		recipient: {
			id: recipientId
		},
		sender_action: "typing_off"
	};

	callSendAPI(messageData);
}

/*
 * Send a message with the account linking call-to-action
 *
 */
function sendAccountLinking(recipientId) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "template",
				payload: {
					template_type: "button",
					text: "Welcome. Link your account.",
					buttons: [{
						type: "account_link",
						url: process.env.SERVER_URL + "/authorize"
          }]
				}
			}
		}
	};

	callSendAPI(messageData);
}


function greetUserText(userId) {
	//first read user firstname
	request({
		uri: 'https://graph.facebook.com/v2.7/' + userId,
		qs: {
			access_token: process.env.FB_PAGE_TOKEN
		}

	}, function (error, response, body) {
		if (!error && response.statusCode == 200) {

			var user = JSON.parse(body);
			console.log("getUserData:" + user);
			if (user.first_name) {
				console.log("FB user: %s %s, %s",
					user.first_name, user.last_name, user.gender);

				sendTextMessage(userId, "Welcome " + user.first_name + '! ' +
				'I can answer frequently asked questions for you ' +
				'and I perform job interviews. What can I help you with?');
			} else {
				console.log("Cannot get data for fb user with id",
					userId);
			}
		} else {
			console.error(response.error);
		}

	});
}

/*
 * Call the Send API. The message data goes in the body. If successful, we'll
 * get the message id in a response
 *
 */
function callSendAPI(messageData) {
	request({
		uri: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {
			access_token: process.env.FB_PAGE_TOKEN
		},
		method: 'POST',
		json: messageData

	}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var recipientId = body.recipient_id;
			var messageId = body.message_id;

			if (messageId) {
				console.log("Successfully sent message with id %s to recipient %s",
					messageId, recipientId);
			} else {
				console.log("Successfully called Send API for recipient %s",
					recipientId);
			}
		} else {
			console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
		}
	});
}



/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 *
 */
function receivedPostback(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var timeOfPostback = event.timestamp;

	// The 'payload' param is a developer-defined field which is set in a postback
	// button for Structured Messages.
	var payload = event.postback.payload;

	switch (payload) {
		case 'GET_STARTED':
			greetUserText(senderID);
			break;
		case 'JOB_APPLY':
			//get feedback with new jobs
			sendToApiAi(senderID, "job openings");
			break;
		case 'CHAT':
			//user wants to chat
			sendTextMessage(senderID, "I love chatting too. Do you have any other questions for me?");
			break;
		default:
			//unindentified payload
			sendTextMessage(senderID, "I'm not sure what you want. Can you be more specific?");
			break;

	}
	console.log("payload" + payload);
	console.log("Received postback for user %d and page %d with payload '%s' " +
		"at %d", senderID, recipientID, payload, timeOfPostback);

}


/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 *
 */
function receivedMessageRead(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;

	// All messages before watermark (a timestamp) or sequence have been seen.
	var watermark = event.read.watermark;
	var sequenceNumber = event.read.seq;

	console.log("Received message read event for watermark %d and sequence " +
		"number %d", watermark, sequenceNumber);
}

/*
 * Account Link Event
 *
 * This event is called when the Link Account or UnLink Account action has been
 * tapped.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
 *
 */
function receivedAccountLink(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;

	var status = event.account_linking.status;
	var authCode = event.account_linking.authorization_code;

	console.log("Received account link event with for user %d with status %s " +
		"and auth code %s ", senderID, status, authCode);
}

/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
function receivedDeliveryConfirmation(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var delivery = event.delivery;
	var messageIDs = delivery.mids;
	var watermark = delivery.watermark;
	var sequenceNumber = delivery.seq;

	if (messageIDs) {
		messageIDs.forEach(function (messageID) {
			console.log("Received delivery confirmation for message ID: %s",
				messageID);
		});
	}

	console.log("All message before %d were delivered.", watermark);
}

/*
 * Authorization Event
 *
 * The value for 'optin.ref' is defined in the entry point. For the "Send to
 * Messenger" plugin, it is the 'data-ref' field. Read more at
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
 *
 */
function receivedAuthentication(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var timeOfAuth = event.timestamp;

	// The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
	// The developer can set this to an arbitrary value to associate the
	// authentication callback with the 'Send to Messenger' click event. This is
	// a way to do account linking when the user clicks the 'Send to Messenger'
	// plugin.
	var passThroughParam = event.optin.ref;

	console.log("Received authentication for user %d and page %d with pass " +
		"through param '%s' at %d", senderID, recipientID, passThroughParam,
		timeOfAuth);

	// When an authentication is received, we'll send a message back to the sender
	// to let them know it was successful.
	sendTextMessage(senderID, "Authentication successful");
}

/*
 * Verify that the callback came from Facebook. Using the App Secret from
 * the App Dashboard, we can verify the signature that is sent with each
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
	var signature = req.headers["x-hub-signature"];

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

function sendEmail(subject, content) {
	var helper = require('sendgrid').mail;

	var from_email = new helper.Email(process.env.EMAIL_FROM);
	var to_email = new helper.Email(process.env.EMAIL_TO);
	var subject = subject;
	var content = new helper.Content("text/html", content);
	var mail = new helper.Mail(from_email, subject, to_email, content);

	var sg = require('sendgrid')(process.env.SENDGRID_API_KEY);
	var request = sg.emptyRequest({
		method: 'POST',
		path: '/v3/mail/send',
		body: mail.toJSON()
	});

	sg.API(request, function(error, response) {
		console.log(response.statusCode)
		console.log(response.body)
		console.log(response.headers)
	})
}

function isDefined(obj) {
	if (typeof obj == 'undefined') {
		return false;
	}

	if (!obj) {
		return false;
	}

	return obj != null;
}

/**
 * Spin up server
 * Set route for load balancer health check and landing page
 */

app.get('/', (req, res) => {
  res.status(200).send(logs);
});

app.get('/health_check', (req, res) => {
  res.status(200).send("I'm not dead yet!");
});


app.listen(app.get('port'), () => {
  console.log(`Server listening at port: ${app.get('port')}`);
});
