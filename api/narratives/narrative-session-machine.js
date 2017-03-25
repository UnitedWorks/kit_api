import { logger } from '../logger';
import { NarrativeSession } from './models';
import StateMachine from './state-machine'

import SmallTalkMachine from './machines/small-talk';
import SetupMachine from './machines/setup';
import VotingMachine from './machines/voting';
import ComplaintMachine from './machines/complaint';
import SanitationMachine from './machines/sanitation';
import EmploymentMachine from './machines/employment';
import HealthMachine from './machines/health';
import SocialServicesMachine from './machines/social-services';
import BenefitsInternetMachine from './machines/benefits-internet';

export const stateMachines = {
  smallTalk: SmallTalkMachine,
  setup: SetupMachine,
  voting: VotingMachine,
  complaint: ComplaintMachine,
  sanitation: SanitationMachine,
  employment: EmploymentMachine,
  health: HealthMachine,
  socialServices: SocialServicesMachine,
  'benefits-internet': BenefitsInternetMachine
};

const RESPONSE_TIMEOUT_MS = 8.64e+7;

export class NarrativeSessionMachine extends StateMachine {
  constructor(snapshot, messagingClient) {
    if (Date.now() - (snapshot.data_store.last_checked || 0) > RESPONSE_TIMEOUT_MS) {
      snapshot.state_machine_name = 'smallTalk';
      snapshot.state_machine_previous_state = snapshot.state_machine_current_state;
      snapshot.state_machine_current_state = 'start';
    }

    super(
      stateMachines[snapshot.state_machine_name],
      snapshot.state_machine_current_state,
      snapshot.state_machine_previous_state,
      snapshot.data_store,
    );

    this.set('last_checked', Date.now());
    this.snapshot = snapshot;
    this.messagingClient = messagingClient;
  }

  stateRedirect(instructions, nextState, message) {
    if (instructions === 'location') {
      this.messagingClient.send('Ok! First, what CITY and STATE are you located in?');
      const stateRedirects = [{
        whenExiting: 'setup.waiting_organization_confirm',
        exitIs: 'smallTalk.askOptions',
        exitInstead: nextState,
      }];
      if (this.get('stateRedirects') && this.get('stateRedirects').length > 0) {
        stateRedirects.push(...this.get('stateRedirects'));
      }
      this.set('stateRedirects', stateRedirects);
      return 'setup.waiting_organization';
    }
    if (message) {
      this.messagingClient.send(message);
    }
    if (!this.get('stateRedirects')) {
      this.set('stateRedirects', [instructions]);
    } else {
      this.set('stateRedirects', [instructions, ...this.get('stateRedirects')]);
    }
    return nextState;
  }

  checkMultiRedirect(checkState, fallbackState) {
    if (this.get('stateRedirects') && this.get('stateRedirects')[0].whenExiting.includes(checkState)) {
      return this.get('stateRedirects')[0].exitInstead;
    }
    return fallbackState;
  }

  setState(state) {
    let newState = state;

    // Checks for Redirecting State - Check for object on data store
    if (this.snapshot.data_store.stateRedirects && this.snapshot.data_store.stateRedirects.length > 0) {
      // Does the exiting state match our stateRedirect whenExiting?
      if (this.snapshot.data_store.stateRedirects[0].whenExiting.includes(this.snapshot.state_machine_previous_state)) {
        // The state we're going to was what our redirect was. Means succes, and remove redirect
        if (RegExp(`${state}$`).test(this.snapshot.data_store.stateRedirects[0].exitInstead)) {
          newState = this.snapshot.data_store.stateRedirects[0].exitInstead;
          this.snapshot.data_store.stateRedirects = this.snapshot.data_store.stateRedirects.slice(1);
        // We want the redirect to happen when the state exited in a certain manner
        // Ex: when setting location, we only want redirect to happen when successful,
        // not when looping back for clairifcation
        } else if (this.snapshot.data_store.stateRedirects[0].exitIs !== undefined) {
          // If the exit condition exists, and the state we were going to matches our condition
          if (RegExp(`${state}$`).test(this.snapshot.data_store.stateRedirects[0].exitIs)) {
            newState = this.snapshot.data_store.stateRedirects[0].exitInstead;
            this.snapshot.data_store.stateRedirects = this.snapshot.data_store.stateRedirects.slice(1);
          }
        }
      // Does the state we're going to match what the redirect's end goal is?
      } else if (this.snapshot.data_store.stateRedirects[0].exitInstead === state) {
        this.snapshot.data_store.stateRedirects = this.snapshot.data_store.stateRedirects.slice(1);
      }
    } else {
      // Clear the datastore object if its empty
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
