import apiai from 'apiai';
import { logger } from '../logger';
import { sessionIds, interfaces, actions } from '../conversations/index';
import * as utils from '../utils/index';

export const apiAiService = apiai(process.env.API_AI_CLIENT_ACCESS_TOKEN, {
	language: 'en'
});

export function sendToApiAi(sender, text) {
	logger.info('sendToApiAi: sender:' + sender);
	logger.info('sendToApiAi: text:' + text);
	interfaces.facebook.send.sendTypingOn(sender);
	let apiaiRequest = apiAiService.textRequest(text, {
		sessionId: sessionIds.get(sender)
	});

	apiaiRequest.on('response', (response) => {
		if (utils.isDefined(response.result)) {
			handleApiAiResponse(sender, response);
		}
	});

	apiaiRequest.on('error', (error) => {
		logger.error(error)
	});

	apiaiRequest.end();
}

export function handleApiAiResponse(sender, response) {
	let responseText = response.result.fulfillment.speech;
	let responseData = response.result.fulfillment.data;
	let action = response.result.action;
	let contexts = response.result.contexts;
	let parameters = response.result.parameters;

	logger.info('responseText: ' + responseText);
	logger.info('responseData: ' + responseData);
	logger.info('action: ' + action);
	interfaces.facebook.send.sendTypingOff(sender);

	if (responseText == '' && !utils.isDefined(action)) {
		//api ai could not evaluate input.
		logger.info('Unknown query' + response.result.resolvedQuery);
		interfaces.facebook.send.sendTextMessage(senderID, "I'm not sure what you want. Can you be more specific?");
	} else if (utils.isDefined(action)) {
		actions.handleAction(sender, action, responseText, contexts, parameters);
	} else if (utils.isDefined(responseData) && utils.isDefined(responseData.facebook)) {
		try {
			logger.info('Response as formatted message' + responseData.facebook);
			interfaces.facebook.send.sendTextMessage(sender, responseData.facebook);
		} catch (err) {
			interfaces.facebook.send.sendTextMessage(sender, err.message);
		}
	} else if (utils.isDefined(responseText)) {
		logger.info('Respond as text message');
		interfaces.facebook.send.sendTextMessage(sender, responseText);
	}
}
