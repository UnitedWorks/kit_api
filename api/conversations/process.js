import uuid from 'uuid/v4';
import { logger } from '../logger';
import * as interfaces from '../constants/interfaces';
import { NarrativeStore } from '../narratives/models';
import { Constituent } from '../accounts/models';
import { inputDirector } from '../narratives/states/helpers';

function getConstituent(filterObj) {
  return new Promise((resolve, reject) => {
    Constituent.where(filterObj).fetch().then((model) => {
      if (!model) {
        new Constituent(filterObj).save().then((constituent) => {
          resolve(constituent.toJSON());
        }).catch(err => reject(err));
      } else {
        resolve(model.toJSON());
      }
    }).catch(err => reject(err));
  });
}

function setupConstituentState(constituent) {
  return new Promise((resolve, reject) => {
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
    }).catch(err => reject(err));
  });
}

function normalizeInput(conversationClient, input) {
  let newMessageObject;
  // Input: interface, message, state
  if (conversationClient === interfaces.FACEBOOK) {
    if (Object.prototype.hasOwnProperty.call(input, 'message')) {
      newMessageObject = {
        type: 'message',
        payload: input.message,
      };
    } else if (Object.prototype.hasOwnProperty.call(input, 'postback')) {
      newMessageObject = {
        type: 'action',
        payload: input.postback,
      };
    }
    delete newMessageObject.mid;
    delete newMessageObject.seq;
  } else if (conversationClient === interfaces.TWILIO) {
    newMessageObject = {
      type: 'message',
      payload: {
        text: input.Body,
      },
    };
    if (input.NumMedia > 0) {
      if (!Object.prototype.hasOwnProperty.call(newMessageObject.payload, 'attachments')) {
        newMessageObject.payload.attachments = [];
      }
      for (let a = 0; a <= 9; a += 1) {
        if (Object.prototype.hasOwnProperty.call(input, `MediaContentType${a}`)) {
          newMessageObject.payload.attachments.push({
            type: input[`MediaContentType${a}`],
            payload: {
              url: input[`MediaUrl${a}`],
            },
          });
        }
      }
    }
  }
  // Output: reformatted message
  return newMessageObject;
}

function normalizeSessionsFromRequest(req, conversationClient) {
  // Input: Request Object
  return new Promise((resolve, reject) => {
    if (conversationClient === interfaces.FACEBOOK) {
      let messageCount = 0;
      let messageTotal = 0;
      req.body.entry.forEach((entry) => { messageTotal += entry.messaging.length; });
      const readyStates = [];
      req.body.entry.forEach((entry) => {
        entry.messaging.forEach((input) => {
          // Does: Get user
          getConstituent({ facebook_id: input.sender.id }).then((constituent) => {
            // Does: Gets narrative_state snapshot and adds to data store's context?
            setupConstituentState(constituent).then((constituentState) => {
              const state = constituentState;
              state.data_store.conversationClient = conversationClient;
              state.data_store.input = normalizeInput(conversationClient, input);
              readyStates.push(state);
              messageCount += 1;
              if (messageCount === messageTotal) {
                resolve(readyStates);
              }
            }).catch(err => reject(err));
          }).catch(err => reject(err));
        });
      });
    } else if (conversationClient === interfaces.TWILIO) {
      const input = req.body;
      getConstituent({ phone: input.From }).then((constituent) => {
        setupConstituentState(constituent).then((constituentState) => {
          const state = constituentState;
          state.data_store.conversationClient = conversationClient;
          state.data_store.input = normalizeInput(conversationClient, input);
          resolve([state]);
        }).catch(err => reject(err));
      }).catch(err => reject(err));
    }
  });
}

export function webhookHitWithMessage(req, res, conversationClient) {
  // Input: Request Object
  // Does: Normalizes data format for our state machines
  normalizeSessionsFromRequest(req, conversationClient).then((normalizedStates) => {
    // Follup: Send to state machine
    normalizedStates.forEach((stateSnapShot) => {
      const appSession = { res };
      if (!stateSnapShot.over_ride) {
        inputDirector(appSession, stateSnapShot);
      }
    });
  }).catch(err => logger.error(err));
}
