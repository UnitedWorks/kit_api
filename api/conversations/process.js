import uuid from 'uuid/v4';
import { logger } from '../logger';
import * as interfaces from '../constants/interfaces';
import { NarrativeSession } from '../narratives/models';
import { Constituent } from '../accounts/models';
import { inputDirector } from '../narratives/states/helpers';

// TODO(youmustfight, nicksahler): We eventually need to filter interface properties too
function setupConstituentState(constituent) {
  return NarrativeSession.collection({
    constituent_id: constituent.id,
  }).fetchOne().then((model) => {
    if (model) {
      return (Object.assign({}, model.toJSON(), { constituent }));
    } else {
      return {
        session_id: uuid(),
        state_machine_name: 'smallTalk',
        state_machine_previous_state: null,
        state_machine_current_state: null,
        over_ride: false,
        data_store: {},
        constituent,
      }
    }
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
  if (conversationClient === interfaces.FACEBOOK) {
    const readyStates = [];
    let messages = [].concat.apply([], req.body.entry.map(function(entry) {
      return entry.messaging;
    }));

    return Promise.all(
      messages.map(function(input) {
        return Constituent.where({ facebook_id: input.sender.id }).fetch().then((model) => {  
          return model || new Constituent({ facebook_id: input.sender.id }).save();
        }).then(function(c) {
          return setupConstituentState(c.toJSON());
        }).then((state) => {
          // Mark: Gets narrative_state snapshot and adds to data store's context?
          // Nick: We should store this elsewhere. Moving for now.
          return Object.assign(state, {input: normalizeInput(conversationClient, input), conversationClient: conversationClient});
        })
      })
    );
  } else if (conversationClient === interfaces.TWILIO) {
    const input = req.body;

    return Constituent.where({ phone: input.From } ).fetch().then((model) => {  
      return model || new Constituent(filterObj).save();
    }).then((constituent) => {
      return setupConstituentState(constituent.toJSON()).then((constituentState) => {
        const state = constituentState;

        state.data_store.conversationClient = conversationClient;
        state.data_store.input = normalizeInput(conversationClient, input);
        return [state];
      })
    })
  }
}

export function webhookHitWithMessage(req, res, conversationClient) {
  // Input: Request Object
  // Does: Normalizes data format for our state machines
  // TODO(nicksahler): Promise.all() or something
  
  normalizeSessionsFromRequest(req, conversationClient).then((normalizedStates) => {
    normalizedStates.forEach((stateSnapShot) => {
      const appSession = { res };
      if (!stateSnapShot.over_ride_on) {
        inputDirector(appSession, stateSnapShot);
      }
    });
  }).catch(err => logger.error(err));
}
