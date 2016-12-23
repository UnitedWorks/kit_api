import apiai from 'apiai';
import { logger } from '../logger';
import { sessionIds, events, actions } from '../conversations/index';
import * as utils from '../utils/index';

export class NLPService {

	constructor() {
		this.service = apiai(process.env.API_AI_CLIENT_ACCESS_TOKEN, {
			language: 'en'
		});
	}

	sendTo(options) {
		let sender = options.senderID;
		let text = options.text;

		logger.info(`sendToApiAi: sender: ${sender}`);
		logger.info(`sendToApiAi: text: ${text}`);
		logger.info(`sendToApiAi: sessionIds: ${sessionIds}`);
		logger.info(`sendToApiAi: sessionId: ${sessionIds.get(sender)}`);
		SendInterface({
			event: event,
			context: context,
		}).sendTypingOn(sender);
		let request = this.service.textRequest(text, {
			sessionId: sessionIds.get(sender)
		});
		request.on('response', (response) => {
			logger.info(`apiAi request response: ${response}`);
			if (utils.isDefined(response.result)) {
				this.handleResponse({
					event: options.event,
					context: options.context,
					sender: sender,
					response: response,
				});
			}
		});
		request.on('error', (error) => {
			logger.error(error)
		});
		request.end();
	}

	handleResponse(options) {
		let { event } = options;
		let { context } = options;
		let { sender } = options;
		let { response } = options;

		let responseText = response.result.fulfillment.speech;
		let responseData = response.result.fulfillment.data;
		let action = response.result.action;
		let contexts = response.result.contexts;
		let parameters = response.result.parameters;

		logger.info(`responseText: ${responseText}`);
		logger.info(`responseData: ${responseData}`);
		logger.info(`action: ${action}`);
		SendInterface({
			event: event,
			context: context,
		}).sendTypingOff(sender);

		if (responseText == '' && !utils.isDefined(action)) {
			//api ai could not evaluate input.
			logger.info(`Unknown query: ${response.result.resolvedQuery}`);
			SendInterface({
				event: event,
				context: context,
			}).sendTextMessage(senderID, "I'm not sure what you want. Can you be more specific?");
		} else if (utils.isDefined(action)) {
			actions.handleAction(sender, action, responseText, contexts, parameters);
		} else if (utils.isDefined(responseData) && utils.isDefined(responseData.facebook)) {
			try {
				logger.info('Response as formatted message' + responseData.facebook);
				SendInterface({
					event: event,
					context: context,
				}).sendTextMessage(sender, responseData.facebook);
			} catch (err) {
				SendInterface({
					event: event,
					context: context,
				}).sendTextMessage(sender, err.message);
			}
		} else if (utils.isDefined(responseText)) {
			logger.info('Respond as text message');
			SendInterface({
				event: event,
				context: context,
			}).sendTextMessage(sender, responseText);
		}
	}

}
