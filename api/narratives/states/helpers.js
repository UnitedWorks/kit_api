import { logger } from '../../logger';
import SmallTalkMachine from './small-talk';

export const hasSource = (sources, label) => {
  const listLength = sources.filter((source) => {
    return source.label === label;
  }).length;
  if (listLength > 0) {
    return true;
  }
  return false;
};

export const stateMachines = {
  smallTalk: SmallTalkMachine,
};

export const inputDirector = (appSession, stateSnapShot) => {
  logger.info(`Running Machine: ${stateSnapShot.state_machine_name}`);
  new stateMachines[stateSnapShot.state_machine_name](appSession, stateSnapShot);
};
