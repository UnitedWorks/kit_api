import { logger } from '../../logger';
import SmallTalkMachine from './small-talk';

export const entityValueIs = (entities = [], searchValues = []) => {
  let hasValue = false;
  entities.forEach((entity) => {
    if (searchValues.includes(entity.value)) hasValue = true;
  });
  return hasValue;
};

export const stateMachines = {
  smallTalk: SmallTalkMachine,
};

export const inputDirector = (appSession, stateSnapShot) => {
  logger.info(`Running Machine: ${stateSnapShot.state_machine_name}`);
  new stateMachines[stateSnapShot.state_machine_name](appSession, stateSnapShot);
};
