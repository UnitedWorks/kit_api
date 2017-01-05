import { smallTalkMachine } from './small-talk';
import { faqMachine } from './faq';

export class NarrativeStateMachine {
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

export const stateMachines = {
  smallTalk: SmallTalkMachine,
  faq: FaqMachine,
};
