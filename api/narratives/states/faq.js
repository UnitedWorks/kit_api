import { logger } from '../../logger';
import { NarrativeStateMachine } from './state';

const faqStates = {

};

export default class FaqMachine extends NarrativeStateMachine {
  constructor(appSession, stateSnapShot) {
    super(appSession, stateSnapShot, faqStates);
    logger.info('Machine Started: FAQ');
  }
}
