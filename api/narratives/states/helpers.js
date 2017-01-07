import SmallTalkMachine from './small-talk';
// import LocationMachine from './location';
// import { FaqMachine } from './faq';

export const stateMachines = {
  smallTalk: SmallTalkMachine,
  // location: LocationMachine,
  // faq: FaqMachine,
};

export const stateDirector = (appSession, stateSnapShot) => {
  // How do we handle attachments? Location? NLP? In this function or in state?
  new stateMachines[stateSnapShot.state_machine_name](appSession, stateSnapShot);
};
