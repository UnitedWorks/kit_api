import { logger } from '../logger';
import { modules } from './modules';

export class ActionDispatch {

	constructor(config) {
		this.event = config.event;
		this.context = config.context;
	}

	handleAction(sender, action, responseText, contexts, parameters) {

		// Handle Action
		logger.info(`Handling Action -- sender: ${sender}, action: ${action}, responseText: ${responseText}, contexts: ${contexts}, ${parameters}`);

		let moduleTag = action.match(/(^.*)-/)[1];
		switch (moduleTag) {
			case 'request':
				// Send to 311 module
				modules.request(sender, action, responseText, contexts, parameters);
				break;
			case 'faq':
				// Send to FAQ module
				modules.faq(sender, action, responseText, contexts, parameters);
				break;
			case 'smalltalk':
				// Send to SmallTalk module
				modules.smallTalk(sender, action, responseText, contexts, parameters);
				break;
			default:
				// Send to fallback base module
				modules.base(sender, action, responseText, contexts, parameters);
				break;
		}
	}

}
