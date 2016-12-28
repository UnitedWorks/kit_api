import apiai from 'apiai';
import { logger } from '../logger';
import { sessionIds, actions } from '../conversations/index';
import * as utils from '../utils/index';
import { SendInterface } from '../conversations/send';
import { ActionDispatch } from '../conversations/action';

export class NLPService {

	constructor(config) {
		this.service = apiai(process.env.API_AI_CLIENT_ACCESS_TOKEN, {
			language: 'en'
		});
		this.event = config.event;
		this.context = config.context;
	}

	evaluate(options) {
		let sender = options.senderID;
		let text = options.text;

		this.sender = sender;

		logger.info(`sendToApiAi: sender: ${sender}`);
		logger.info(`sendToApiAi: text: ${text}`);
		logger.info(`sendToApiAi: sessionIds: ${sessionIds}`);
		logger.info(`sendToApiAi: sessionId: ${sessionIds.get(sender)}`);

		let SendClient = new SendInterface({
			event: this.event,
			context: this.context,
		});

		SendClient.sendTypingOn(sender);

		new Promise((resolve, reject) => {

			let nlpRequest = this.service.textRequest(text, {
				sessionId: sessionIds.get(sender)
			});
			nlpRequest.on('response', (response) => {
				logger.info(`apiAi request response: ${response}`);
				if (utils.isDefined(response.result)) {
					resolve(response);
				}
			});
			nlpRequest.on('error', (error) => {
				logger.error(error)
				reject(error);
			});
			nlpRequest.end();

		}).then((response) => {
			this.response = response;
			if (options.handleResponse) {
				return this.handleResponse();
			} else {
				return this;
			}
		});

	}

	handleResponse(options) {
		let sender = this.sender;
		let response = this.response;
		let responseText = response.result.fulfillment.speech;
		let responseData = response.result.fulfillment.data;
		let action = response.result.action;
		let contexts = response.result.contexts;
		let parameters = response.result.parameters;

		logger.info(`response: ${responseText} // Data: ${responseData} // Action: ${action}`);

		let SendClient = new SendInterface({
			event: this.event,
			context: this.context,
		});

		SendClient.sendTypingOff(sender);

		if (responseText == '' && !utils.isDefined(action)) {
			//api ai could not evaluate input.
			logger.info(`Unknown query: ${response.result.resolvedQuery}`);
			SendClient.sendTextMessage(sender, "I'm not sure what you want. Can you be more specific?");
		} else if (utils.isDefined(action)) {
			new ActionDispatch({
				event: this.event,
				context: this.context,
			}).handleAction(sender, action, responseText, contexts, parameters);
		} else if (utils.isDefined(responseData) && utils.isDefined(responseData.facebook)) {
			try {
				logger.info('Response as formatted message' + responseData.facebook);
				SendClient.sendTextMessage(sender, responseData.facebook);
			} catch (err) {
				SendClient.sendTextMessage(sender, err.message);
			}
		} else if (utils.isDefined(responseText)) {
			logger.info('Respond as text message');
			SendClient.sendTextMessage(sender, responseText);
		}
	}

}
