import { logger } from '../../logger';


import SmallTalkMachine from './small-talk';
import SetupMachine from './setup-states';
import VotingMachine from './voting-states';
import ComplaintMachine from './complaint-states';

import { NarrativeSessionMachine } from './state';


export const entityValueIs = (entities = [], searchValues = []) => {
  let hasValue = false;
  entities.forEach((entity) => {
    if (searchValues.includes(entity.value)) hasValue = true;
  });
  return hasValue;
};

export const stateMachines = {
  smallTalk: SmallTalkMachine,
  setup: SetupMachine,
  voting: VotingMachine,
  complaint: ComplaintMachine
};

export const inputDirector = (appSession, snapshot) => {
  logger.info(`Running Machine: ${snapshot.state_machine_name}`);
  var instance = new NarrativeSessionMachine(stateMachines[snapshot.state_machine_name], snapshot);

  if (typeof snapshot.state_machine_current_state !== 'string' && typeof snapshot.organization_id !== 'string') {
    return instance.input('enter').then(()=>instance.save());
  } else if (instance.current) {
    instance.messagingClient.isTyping(true);
    return instance.input(snapshot.input.type, { input: snapshot.input }).then(()=>instance.save());
  } else {
    return instance.fire('smallTalk.start', snapshot.input.type, { input: snapshot.input } ).then(()=>instance.save());
  }
};
