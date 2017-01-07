import { logger } from '../../logger';
import * as interfaces from '../../constants/interfaces';
import { stateMachines } from './helpers';
import { BaseClient, FacebookMessengerClient } from '../../conversations/clients';

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

export class NarrativeStateMachine extends StateMachine {
  constructor(appSession, snapshot, states) {
    // Easier setup of state
    super(states,
      snapshot.state_machine_current_state,
      snapshot.state_machine_previous_state,
      snapshot.data_store);
    this.snapshot = snapshot;
    this.session = appSession;
    if (snapshot.data_store.clientInterface === interfaces.FACEBOOK) {
      this.messagingClient = new FacebookMessengerClient();
    } else {
      this.messagingClient = new BaseClient();
    }
    this.fire('init', 'enter');
  }
  // A method for transferring to a different machine
  changeMachine(machineName, event) {
    logger.info(`Changing Machine: ${machineName}`);
    const newMachine = new stateMachines[machineName](this.session, this.snapshot);
    newMachine.fire('init', event);
  }
}
