import { logger } from '../../logger';
import SmallTalkMachine from './small-talk';
import { checkIntegration } from '../../integrations/helpers';

export const hasIntegration = (organization, integrationLabel) => {
  return checkIntegration(organization, { label: integrationLabel })
    .then(bool => bool)
    .catch(error => error);
};

export const stateMachines = {
  smallTalk: SmallTalkMachine,
};

export const inputDirector = (appSession, stateSnapShot) => {
  logger.info(`Running Machine: ${stateSnapShot.state_machine_name}`);
  new stateMachines[stateSnapShot.state_machine_name](appSession, stateSnapShot);
};
