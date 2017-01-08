import { Wit, log } from 'node-wit';
import { logger } from '../logger';

export const nlp = new Wit({
  accessToken: process.env.WIT_ACCESS_TOKEN,
  actions: {
    send(request, response) {
      const {sessionId, context, entities} = request;
      const {text, quickreplies} = response;
      return new Promise((resolve, reject) => {
        logger.info(JSON.stringify(response));
        return resolve();
      });
    },
  },
});
