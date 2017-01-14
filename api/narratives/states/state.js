import { logger } from '../../logger';
import * as interfaces from '../../constants/interfaces';
import { BaseClient, FacebookMessengerClient, TwilioSMSClient } from '../../conversations/clients';
import { NarrativeStore } from '../models';

export class StateMachine {
  constructor(states, current, previous, datastore) {
    this.states = states;
    this.current = current || 'init';
    this.previous = previous || null;
    this.datastore = datastore || {};
  }

  set(key, value) {
    this.datastore[key] = value;
    this.fire('data', 'enter', this.datastore);
  }

  get(key) {
    return this.datastore[key];
  }

  input(event, aux) {
    logger.info(`Event Input: ${this.current}`);
    this.fire(this.current, event, aux);
  }

  fire(state, event, aux) {
    const func = (this.states[state] && this.states[state][event]) || this.states[state];
    const result = (func && typeof func === 'function') ? func.call(this, aux) : null;
    if (result) {
      this.previous = this.current;
      this.current = result;
      this.fire(this.current, 'enter', aux);
    }
  }
}

export class NarrativeStoreMachine extends StateMachine {
  constructor(appSession, snapshot, states) {
    // Set State
    super(states, snapshot.state_machine_current_state, snapshot.state_machine_previous_state,
      snapshot.data_store);
    this.snapshot = snapshot;

    // Set the Messaging Client
    if (this.snapshot.data_store.conversationClient === interfaces.FACEBOOK) {
      this.messagingClient = new FacebookMessengerClient();
    } else if (this.snapshot.data_store.conversationClient === interfaces.TWILIO) {
      this.messagingClient = new TwilioSMSClient();
    } else {
      this.messagingClient = new BaseClient();
    }
  }

  exit(pickUpState) {
    logger.info('Exiting');
    NarrativeStore.where({ session_id: this.snapshot.session_id }).fetch().then((existingStore) => {
      const attributes = {
        constituent_id: this.snapshot.constituent.id,
        session_id: this.snapshot.session_id,
        state_machine_name: this.snapshot.state_machine_name,
        state_machine_previous_state: this.current,
        state_machine_current_state: pickUpState,
        over_ride: false,
        data_store: this.snapshot.data_store,
      };
      if (this.get('organization')) {
        attributes.organization_id = this.get('organization').id || null;
      }
      if (existingStore) {
        attributes.id = existingStore.attributes.id;
      }
      NarrativeStore.forge(attributes).save(null, null).then(() => {
        // logger.info(state.attributes);
      });
    });
  }
}
