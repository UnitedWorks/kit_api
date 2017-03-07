import { logger } from '../logger';
import * as interfaces from '../constants/interfaces';
import { BaseClient, FacebookMessengerClient, TwilioSMSClient } from '../conversations/clients';
import { NarrativeSession } from './models';

import { stateMachines } from './helpers';


export class StateMachine {
  constructor(states, current, previous, datastore) {
    this.states = states;
    this.current = current || 'init';
    this.previous = previous || null;
    this.datastore = datastore || {};
  }

  set(key, value) {
    this.datastore[key] = value;
  }

  get(key) {
    return this.datastore[key];
  }

  input(event, aux) {
    return this.fire(this.current, event, aux);
  }

  resolve(state, event) {
    return (this.states[state] && this.states[state][event]) || this.states[state];
  }

  setState(state) {
    this.previous = this.current;
    this.current = state;
  }

  fire(state, event, aux) {
    const func = this.resolve(state, event);
    const next = (func && typeof func === 'function') ? func.call(this, aux) : null;
    const self = this;

    /* ** ~~((New and Improved!!!!!))~~ ** */
    // TODO(nicksahler) Handler promise failure better. Maybe go to an error state in the bot?
    return Promise.resolve(next).then((result) => {
      logger.info(`${state} (${event}) -> ${result}`);

      if (!result) {
        return null;
      }

      self.setState(result);
      return self.fire(self.current, 'enter', aux);
    }).catch(err => logger.error('error', err));
  }
}

export class NarrativeSessionMachine extends StateMachine {
  constructor(states, snapshot) {
    super(
      states,
      snapshot.state_machine_current_state,
      snapshot.state_machine_previous_state,
      snapshot.data_store,
    );

    this.snapshot = snapshot;

    // Set the Messaging Client
    const clientConfig = { constituent: this.snapshot.constituent };
    switch (this.snapshot.conversationClient) {
      case interfaces.FACEBOOK:
        this.messagingClient = new FacebookMessengerClient(clientConfig);
        break;
      case interfaces.TWILIO:
        this.messagingClient = new TwilioSMSClient(clientConfig);
        break;
      default:
        this.messagingClient = new BaseClient();
    }
  }

  setState(state) {
    let newState = state;

    if (this.snapshot.data_store.stateRedirects && this.snapshot.data_store.stateRedirects.length > 0) {
      if (this.snapshot.data_store.stateRedirects[0].whenExiting.includes(this.snapshot.state_machine_previous_state)) {
        if (RegExp(`${state}$`).test(this.snapshot.data_store.stateRedirects[0].goTo)) {
          newState = this.snapshot.data_store.stateRedirects[0].goTo;
          this.snapshot.data_store.stateRedirects = this.snapshot.data_store.stateRedirects.slice(1);
        } else if (this.snapshot.data_store.stateRedirects[0].exitWas !== undefined) {
          if (RegExp(`${state}$`).test(this.snapshot.data_store.stateRedirects[0].exitWas)) {
            newState = this.snapshot.data_store.stateRedirects[0].goTo;
            this.snapshot.data_store.stateRedirects = this.snapshot.data_store.stateRedirects.slice(1);
          }
        }
      } else if (this.snapshot.data_store.stateRedirects[0].goTo === state) {
        this.snapshot.data_store.stateRedirects = this.snapshot.data_store.stateRedirects.slice(1);
      }
    } else {
      delete this.snapshot.data_store.stateRedirects;
    }

    /* Support moving between machines */
    const split = newState.split('.').reverse();
    const machine = split[1] || this.snapshot.state_machine_name;
    const s = split[0];

    if (machine !== this.snapshot.state_machine_name && stateMachines[machine]) {
      this.states = stateMachines[machine];
      this.snapshot.state_machine_name = machine;
    }

    super.setState(s);
  }

  // TODO(nicksahler): Proper SQL update
  save() {
    const self = this;
    return NarrativeSession.where({ session_id: self.snapshot.session_id }).fetch().then((existingStore) => {
      const attributes = {
        constituent_id: self.snapshot.constituent.id,
        session_id: self.snapshot.session_id,
        state_machine_name: self.snapshot.state_machine_name,
        state_machine_previous_state: self.previous,
        state_machine_current_state: self.current,
        data_store: self.snapshot.data_store,
      };

      if (self.get('organization')) {
        attributes.organization_id = self.get('organization').id || null;
      }

      if (existingStore) {
        attributes.id = existingStore.attributes.id;
      }

      return NarrativeSession.forge(attributes).save(null, null).then(()=>{});
    });
  }
}
