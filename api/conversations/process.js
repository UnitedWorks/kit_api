import uuid from 'uuid/v4';
import { logger } from '../logger';
import * as interfaces from '../constants/interfaces';
import { NarrativeStore } from '../narratives/models';
import { Constituent } from '../accounts/models';
import { stateDirector } from '../narratives/states/helpers';

function getConstituent(senderId) {
  return new Promise((resolve, reject) => {
    Constituent.where({ facebook_id: senderId }).fetch().then((model) => {
      if (!model) {
        new Constituent({ facebook_id: senderId }).save().then((constituent) => {
          resolve(constituent.toJSON());
        });
      } else {
        resolve(model.toJSON());
      }
    });
  });
}

function setupConstituentState(constituent) {
  return new Promise((resolve) => {
    NarrativeStore.collection({
      constituent_id: constituent.id,
      // We eventually need to filter interface properties too
    }).fetchOne().then((model) => {
      if (model === null) {
        resolve({
          session_id: uuid(),
          state_machine_name: 'smallTalk',
          state_machine_previous_state: null,
          state_machine_current_state: null,
          over_ride: false,
          data_store: {},
          constituent,
        });
      } else {
        resolve(Object.assign({}, model.toJSON(), { constituent }));
      }
    });
  });
}

function normalizeMessage(conversationClient, messageObject) {
  let adjustedMessageObject;
  // Input: interface, message, state
  if (conversationClient === interfaces.FACEBOOK) {
    adjustedMessageObject = messageObject.message;
    delete adjustedMessageObject.mid;
  }
  // Output: reformatted message
  return adjustedMessageObject;
}

function normalizeStatesFromRequest(req) {
  // Input: Request Object
  // const requestBy = utils.getOrigin(req.headers.origin);
  let messageCount = 0;
  let messageTotal = 0;
  req.body.entry.forEach((entry) => { messageTotal += entry.messaging.length; });
  const readyStates = [];
  // if (requestBy === interfaces.FACEBOOK) {
  return new Promise((resolve) => {
    req.body.entry.forEach((entry) => {
      entry.messaging.forEach((message) => {
        // Does: Get user
        getConstituent(message.sender.id).then((constituent) => {
          // Does: Gets narrative_state snapshot and adds to data store's context?
          setupConstituentState(constituent).then((constituentState) => {
            const state = constituentState;
            state.data_store.conversationClient = interfaces.FACEBOOK;
            state.data_store.input = normalizeMessage(interfaces.FACEBOOK, message);
            readyStates.push(state);
            messageCount += 1;
            if (messageCount === messageTotal) {
              resolve(readyStates);
            }
          });
        });
      });
    });
  });
  // }
}

export function webhookHitWithMessage(req, res) {
  // Input: Request Object
  // Does: Normalizes data format for our state machines
  normalizeStatesFromRequest(req).then((normalizedStates) => {
    // Follup: Send to state machine
    normalizedStates.forEach((stateSnapShot) => {
      const appSession = { res };
      if (!stateSnapShot.over_ride) {
        stateDirector(appSession, stateSnapShot);
      }
    });
  });
}
