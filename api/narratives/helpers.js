import { logger } from '../logger';
import KitClient from './clients/kit-client';
import * as TAGS from '../constants/nlp-tagging';

/* TODO(nicksahler) Move this all to higher order answering */
export const fetchAnswers = (intent, session, filter) => {
  let entities = session.snapshot.nlp.entities;
  /*TODO(nicksahler) Move this higher up (into the filter argument) to clean + validate [wit makes this prone to crashing] */
  let schedule = (entities.schedule && entities.schedule[0])? entities.schedule[0].value : null;

  return new KitClient({ organization: session.get('organization') })
    .getAnswer(intent).then((answers) => {
      if (entities[TAGS.DATETIME]) {
        session.messagingClient.addAll(KitClient.dynamicAnswer(answers, entities[TAGS.DATETIME]));
      } else if (schedule === 'day') {
        session.messagingClient.addAll(KitClient.dynamicAnswer(answers));
      } else {
        session.messagingClient.addAll(KitClient.staticAnswer(answers));
      }
      return session.messagingClient.runQuene().then(() => 'smallTalk.start');
    });
};

