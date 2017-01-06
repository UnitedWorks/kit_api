import { logger } from '../../logger';

export class StateMachine {
  constructor(states, current, previous, datastore) {
    this.states = states;
    this.current = current || 'init';
    this.previous = previous || null;
    this.datastore = datastore || {};
    this.fire('init', 'enter');
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
    let func = (this.states[state] && this.states[state][event]) || this.states[state];
    let result = (func && typeof func === 'function')?func.call(this, aux) : null;

    if (result) {
      this.previous = this.current;
      this.current = result;
      this.fire(this.current, 'enter', aux);
    }
  }
}

export class NarrativeStateMachine extends StateMachine {
  constructor(appSession, stateSnapShot, states) {
    // Easier setup of state
    super(states,
      stateSnapShot.state_machine_current_state,
      stateSnapShot.state_machine_previous_state,
      stateSnapShot.data_store);
    this.session = appSession;
    // Attach parent functions to this class
    this.set = super.set;
    this.get = super.get;
    this.input = super.input;
    this.fire = super.fire;
  }
  // A method for transferring to a different machine
  changeMachine() {
    return logger.info('Going to new machine:');
  }
  // A method for exiting machines entirely
  exit() {
    logger.info('Finishing Interaction');
    return this.session.res.status(200).send('eyoooooooo');
  }
}
