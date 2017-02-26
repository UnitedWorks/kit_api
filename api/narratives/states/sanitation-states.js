import { logger } from '../../logger';

export default {
  garbageSchedule() {
    logger.info('State: garbageSchedule');
    return 'smallTalk.start';
  },
};
