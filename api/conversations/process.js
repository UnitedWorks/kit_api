import { logger } from '../logger';
import * as utils from '../utils/index';
import * as interfaces from '../constants/interfaces';
import { NarrativeState } from '../narratives/models';
import { Constituent } from '../accounts/models';
import { stateMachines } from '../narratives/machines/state';

function getUserInfo(senderId) {
  return Constituent
    .where('facebook_id', senderId)
    .fetchOne({ withRelated: ['defaultOrganization'] })
    .then((rows) => {
      return rows[0];
    });
}

function getPropertyInfo(propertyId) {
  return {
    id: propertyId,
  };
}

function getNarrativeState(constituent, interfaceProperty) {
  // We need to split state by interface properties
  // Ex: A constituent starts talking to Jersey City and New Brunswick
  let state = NarrativeState.where({
    constituent_id: constituent.id,
    // interface_property_id: interfaceProperty.id,  // TODO
  })
  .fetchOne({ withRelated: ['organization'] })
  .then((model) => {
    if (!model) { return null; }
    const updatedModel = model;
    updatedModel.constituent = constituent;
    updatedModel.interfaceProperty = interfaceProperty;
    updatedModel.organization = constituent.defaultOrganization;
    return updatedModel;
  });
  // IF no state exists, set it
  if (!state) {
    state = {
      constituent,
      interfaceProperty,
      organization: constituent.defaultOrganization,
      stateMachineName: 'smallTalk',
      stateMachinePreviousState: null,
      stateMachineCurrentState: null,
      overRide: false,
      stale: false,
      dataStore: {},
    };
  }
  // Output: Organized object containing state, user info, org info, and data from past interactions
  return state;
}

function normalizeMessage(interfaceType, messageObject) {
  // Input: interface, message, state
  if (interfaceType === interfaces.FACEBOOK) {
    const adjustedMessageObject = messageObject;
    delete adjustedMessageObject.mid;
    delete adjustedMessageObject.seq;
    return adjustedMessageObject;
  }
  // Output: reformatted message
  // NLP isn't always necessary so it should be called by state machine
}

function normalizeStatesFromRequest(req) {
  // Input: Request Object
  const requestBy = utils.getOrigin(req.headers.origin);
  const readyStates = [];
  if (requestBy === interfaces.FACEBOOK) {
    req.body.entry.forEach((entry) => {
      entry.messaging.forEach((message) => {
        // Does: Get user
        const constituent = getUserInfo(message.sender.id);
        // Does: Set Recipient {source, id}
        const interfaceProperty = getPropertyInfo(message.recipient.id);
        // Does: Gets narrative_state snapshot and adds to data store's context?
        const stateObject = getNarrativeState(constituent, interfaceProperty);
        stateObject.processedMessage = normalizeMessage(interfaces.FACEBOOK, message, stateObject);
        readyStates.push(stateObject);
      });
    });
  }
  return readyStates;
}

function submitToStateMachine(stateSnapShot) {
  const machine = new stateMachines[stateSnapShot.stateMachineName](stateSnapShot);
}

export function webhookHitWithMessage(req, res) {
  // Input: Request Object
  // Does: Normalizes data format for our state machines
  const normalizedStates = normalizeStatesFromRequest(req)
  // Follup: Send to state machine
  normalizedStates.forEach((stateSnapshot) => {
    submitToStateMachine(stateSnapshot);
  });
}
