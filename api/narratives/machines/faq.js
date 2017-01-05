import { logger } from '../../logger';
import { NarrativeState } from './state';

export class FaqMachine extends NarrativeStateMachine({
  init(stateSnapShot) {
    this.super();
    logger.info('F.A.Q. Machine Started');
  },
});
