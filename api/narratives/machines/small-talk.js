import { logger } from '../../logger';
import { StateMachine } from './state';

export class SmallTalkMachine extends StateMachine {

  constructor() {
    super();
    logger.info('Smalltalk Machine Started');
  }

}
