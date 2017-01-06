import { logger } from '../../logger';
import { NarrativeStateMachine } from './state';

const smallTalkStates = {
  init() {
    logger.info('SmallTalkState: init');
    return 'getStarted';
  },
  getStarted() {
    logger.info('SmallTalkState: getStarted');
    return 'exit';
  },
};

export default class SmallTalkMachine extends NarrativeStateMachine {
  constructor(appSession, stateSnapShot) {
    super(appSession, stateSnapShot, smallTalkStates);
    logger.info('Machine Started: SmallTalk');
    this.fire('init', 'enter');
  }
}
