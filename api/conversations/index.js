import * as action from './action';
import * as helpers from './helpers';
import * as receive from './receive';
import * as send from './send';

export let sessionIds = new Map();

export const methods = {
	send: send,
	receive: receive,
	helpers: helpers,
};

export const actions = action;
