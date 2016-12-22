import * as receiveFacebook from './receiveFacebook';
import * as sendFacebook from './sendFacebook';
import * as helpersFacebook from './helpersFacebook';
import * as receiveWeb from './receiveWeb';
import * as sendWeb from './sendWeb';
import * as helpersWeb from './helpersWeb';
import * as sendEmail from './sendEmail';
import * as action from './action';

export let sessionIds = new Map();

export let interfaces = {
	facebook: {
		send: sendFacebook,
		receive: receiveFacebook,
		helpers: helpersFacebook,
	},
	web: {
		send: sendWeb,
		receive: receiveWeb,
		helpers: helpersWeb,
	},
	email: {
		send: sendEmail,
	}
};

export let actions = {
	handleAction: action.handleAction
};
