import { logger } from '../../logger';
import { NarrativeState } from './state';

export class SmallTalkMachine extends NarrativeStateMachine({
  init(stateSnapShot) {
    this.super();
    logger.info('Smalltalk Machine Started');
  },
});
