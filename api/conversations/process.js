import uuid from 'uuid/v4';
import { logger } from '../logger';
import * as interfaces from '../constants/interfaces';
import { NarrativeSession } from '../narratives/models';
import { Constituent } from '../accounts/models';
import AWSClient from '../services/aws';
import { getBaseState, getOrgNameFromConstituentEntry } from '../narratives/helpers';

import * as clients from '../conversations/clients';
import { NarrativeSessionMachine } from '../narratives/narrative-session-machine';

function normalizeInput(conversationClient, input) {
  return new Promise((resolve) => {
    let newMessageObject;
    // Input: interface, message, state
    if (conversationClient === interfaces.FACEBOOK) {
      if (Object.prototype.hasOwnProperty.call(input, 'message')) {
        // Check for action sent via Quick Reply
        if (input.message.quick_reply && input.message.quick_reply.payload.includes('_')) {
          newMessageObject = {
            type: 'action',
            payload: input.message.quick_reply,
          };
        } else {
          newMessageObject = {
            type: 'message',
            payload: input.message,
          };
        }
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
    } else if (conversationClient === interfaces.HTTP) {
      newMessageObject = {
        type: 'message',
        payload: input
      }
    }

    // Output reformatted message after transfering external media to our S3
    if (newMessageObject.payload.attachments) {
      Promise.all(newMessageObject.payload.attachments.map((attachment) => {
        if (attachment.type !== 'location') {
          return new AWSClient().copyExternalUrlToS3(attachment.payload.url).then((val)=>{
            attachment.payload.url = url;
            return attachment;
          });
        }

        return attachment;
      })).then((attachments) => {
        newMessageObject.payload.attachments = attachments;
        resolve(newMessageObject);
      });
    }
    // Or just output reformatted message
    resolve(newMessageObject);
  });
}

// TODO(youmustfight, nicksahler): We eventually need to filter interface properties too
function setupConstituentState(constituent, organization, location) {
  return NarrativeSession.where({
    constituent_id: constituent.id,
  }).fetch().then((model) => {
    if (model !== null && model.toJSON()) {
      return (Object.assign({}, model.toJSON(), { constituent }));
    }
    const newConstituentState = {
      session_id: uuid(),
      state_machine_name: getBaseState(getOrgNameFromConstituentEntry(constituent), 'machine'),
      state_machine_previous_state: null,
      state_machine_current_state: null,
      over_ride_on: false,
      data_store: {},
      constituent,
    };
    if (organization) {
      newConstituentState.organization_id = organization.id;
      newConstituentState.data_store.organization = organization;
    }
    if (location) newConstituentState.data_store.location = location;
    return newConstituentState;
  });
}

// TODO(nicksahler) make dry
function normalizeSessionsFromRequest(req, conversationClient) {
  const input = req.body;
  if (conversationClient === interfaces.FACEBOOK) {
    const readyStates = [];
    let messages = [].concat.apply([], req.body.entry.map((entry) => {
      return entry.messaging;
    }));

    return Promise.all(
      messages.map((input) => {
        return Constituent.where({ facebook_id: input.sender.id }).fetch().then((model) => {
          return model || new Constituent({ facebook_id: input.sender.id, facebook_entry_id: input.recipient.id }).save();
        }).then((con) => {
          return con.refresh({ withRelated: ['facebookEntry', 'facebookEntry.organization', 'facebookEntry.organization.location'] }).then((c) => {
            const refreshedCon = c.toJSON();
            const pulledOrg = refreshedCon.facebookEntry.organization;
            const pulledLocation = pulledOrg && pulledOrg.location ? pulledOrg.location : null;
            return setupConstituentState(refreshedCon, pulledOrg, pulledLocation);
          });
        }).then((state) => {
          // Mark: Gets narrative_state snapshot and adds to data store's context?
          // Nick: We should store this elsewhere. Moving for now.
          return normalizeInput(conversationClient, input).then((normalizedInput) => {
            return Object.assign(state, { input: normalizedInput });
          });
        });
      }),
    );
  } else if (conversationClient === interfaces.TWILIO) {
    return Constituent.where({ phone: input.From }).fetch().then((model) => {
      return model || new Constituent({ phone: input.From, entry_phone_number: input.To }).save();
    }).then((con) => {
      return con.refresh({ withRelated: ['smsEntry', 'smsEntry.organization', 'smsEntry.organization.location'] }).then((c) => {
        const refreshedCon = c.toJSON();
        const pulledOrg = refreshedCon.smsEntry.organization;
        const pulledLocation = pulledOrg && pulledOrg.location ? pulledOrg.location : null;
        return setupConstituentState(refreshedCon, pulledOrg, pulledLocation);
      });
    }).then((state) => {
      return normalizeInput(conversationClient, input).then((normalizedInput) => {
        return [].concat(Object.assign(state, { input: normalizedInput }));
      });
    });
  /* TODO(nicksahler):
    Support multiple messages at a time for HTTP webhook,
    but not right now since this is not (in a way) async.
    Maybe allow a "callback" argument on this end
  */
  } else if (conversationClient === interfaces.HTTP ) {
    return Constituent.where({ id: req.query.constituent_id }).fetch().then((model)=>{
      return model; // TODO(nicksahler): Handle anonymous constituent creation (possibility for spam)
    }).then((state)=>{
      return setupConstituentState(state.toJSON());
    }).then((state)=>{
      return normalizeInput(conversationClient, input).then((normalizedInput) => {
        return [].concat(Object.assign(state, { input: normalizedInput }));
      })
    });
  }
}

/* TODO(nicksahler) Work this into another, lower level structure */
const clientLookup = {};
clientLookup[interfaces.FACEBOOK] = 'FacebookMessengerClient';
clientLookup[interfaces.TWILIO] = 'TwilioSMSClient';
clientLookup[interfaces.HTTP] = 'HTTPClient';

export function webhookHitWithMessage(req, res, conversationClient) {
  // Input: Request Object
  // Does: Normalizes data format for our state machines
  // TODO(nicksahler): Promise.all() or something

  normalizeSessionsFromRequest(req, conversationClient).then((normalizedStates) => {
    normalizedStates.forEach((snapshot) => {
      if (!snapshot.over_ride_on) {
        logger.info(`Running Machine: ${snapshot.state_machine_name}`);
        logger.info({ c: snapshot.constituent });
        const clientConfig = { constituent: snapshot.constituent, req, res };
        const messagingClient = new (clients[clientLookup[conversationClient]] || clients.BaseClient)(clientConfig);

        const instance = new NarrativeSessionMachine(snapshot, messagingClient);
        let action;

        if (typeof snapshot.state_machine_current_state !== 'string' && typeof snapshot.organization_id !== 'string') {
          action = instance.input('enter');
        } else if (instance.current) {
          instance.messagingClient.isTyping(true);
          action = instance.input(snapshot.input.type, { input: snapshot.input });
        } else {
          action = instance.fire('smallTalk.start', snapshot.input.type, { input: snapshot.input });
        }

        action.then(() => instance.save())
          .then(() => messagingClient.end());
      }
    });
  }).catch(err => logger.error(err));
}
