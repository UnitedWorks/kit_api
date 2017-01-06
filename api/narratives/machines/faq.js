import { logger } from '../../logger';
import { StateMachine } from './state';

export class FaqMachine extends StateMachine {

  constructor() {
    super();
    logger.info('F.A.Q. Machine Started');
  }

}
