import { logger } from '../logger';


import SmallTalkMachine from './states/small-talk';
import SetupMachine from './states/setup-states';
import VotingMachine from './states/voting-states';
import ComplaintMachine from './states/complaint-states';
import SanitationMachine from './states/sanitation-states';
import EmploymentMachine from './states/employment-states';
import HealthMachine from './states/health-states';
import SocialServicesMachine from './states/social-services-states';
import BenefitsInternetMachine from './states/benefits-internet-states';

import { NarrativeSessionMachine } from './machines';


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
  complaint: ComplaintMachine,
  sanitation: SanitationMachine,
  employment: EmploymentMachine,
  health: HealthMachine,
  socialServices: SocialServicesMachine,
  'benefits-internet': BenefitsInternetMachine
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
