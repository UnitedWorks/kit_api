import { logger } from '../logger';

/* TODO(nicksahler): Maybe fail if a returned state is not found - to prevent trapping */
export default class StateMachine {
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

  delete(key) {
    delete this.datastore[key];
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
      logger.debug(`${state} (${event}) -> ${result}`);

      if (!result) {
        return null;
      }

      self.setState(result);
      return self.fire(self.current, 'enter', aux);
    }).catch(err => logger.error('error', err));
  }
}
