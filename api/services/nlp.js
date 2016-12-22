import apiai from 'apiai';
import { logger } from '../logger';
import { sessionIds, events, actions } from '../conversations/index';
import * as utils from '../utils/index';

const nlpProvider = 'apiAi';

const apiAiService = apiai(process.env.API_AI_CLIENT_ACCESS_TOKEN, {
	language: 'en',
	requestSource: 'fb',
});

function sendToApiAi(sender, text) {
	logger.info('sendToApiAi: sender:' + sender);
	logger.info('sendToApiAi: text:' + text);
	logger.info('sendToApiAi: sessionIds:' + sessionIds);
	logger.info('sendToApiAi: sessionId:' + sessionIds.get(sender));
	events.send.sendTypingOn(sender);
	let apiAiRequest = apiAiService.textRequest(text, {
		sessionId: sessionIds.get(sender)
	});

	apiAiRequest.on('response', (response) => {
		logger.info('apiAi request response:', response);
		if (utils.isDefined(response.result)) {
			handleApiAiResponse(sender, response);
		}
	});

	apiAiRequest.on('error', (error) => {
		logger.error(error)
	});

	apiAiRequest.end();
}

function handleApiAiResponse(sender, response) {
	let responseText = response.result.fulfillment.speech;
	let responseData = response.result.fulfillment.data;
	let action = response.result.action;
	let contexts = response.result.contexts;
	let parameters = response.result.parameters;

	logger.info('responseText: ' + responseText);
	logger.info('responseData: ' + responseData);
	logger.info('action: ' + action);
	events.send.sendTypingOff(sender);

	if (responseText == '' && !utils.isDefined(action)) {
		//api ai could not evaluate input.
		logger.info('Unknown query' + response.result.resolvedQuery);
		events.send.sendTextMessage(senderID, "I'm not sure what you want. Can you be more specific?");
	} else if (utils.isDefined(action)) {
		actions.handleAction(sender, action, responseText, contexts, parameters);
	} else if (utils.isDefined(responseData) && utils.isDefined(responseData.facebook)) {
		try {
			logger.info('Response as formatted message' + responseData.facebook);
			events.send.sendTextMessage(sender, responseData.facebook);
		} catch (err) {
			events.send.sendTextMessage(sender, err.message);
		}
	} else if (utils.isDefined(responseText)) {
		logger.info('Respond as text message');
		events.send.sendTextMessage(sender, responseText);
	}
}

const nlpServices = {
	apiAi: {
		service: apiAiService,
		sendToNlp: sendToApiAi,
		handleNlpResponse: handleApiAiResponse,
	}
};

export const nlp = nlpServices[nlpProvider];
