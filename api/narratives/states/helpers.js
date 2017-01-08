import { logger } from '../../logger';
import SmallTalkMachine from './small-talk';
// import { FaqMachine } from './faq';

export const stateMachines = {
  smallTalk: SmallTalkMachine,
  // faq: FaqMachine,
};

export const stateDirector = (appSession, stateSnapShot) => {
  logger.info(`Running Machine: ${stateSnapShot.state_machine_name}`);
  new stateMachines[stateSnapShot.state_machine_name](appSession, stateSnapShot);
};
