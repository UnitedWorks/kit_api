import * as PROVIDERS from '../constants/providers';
import { logger } from '../logger';
import KitClient from './clients/kit-client';
import * as TAGS from '../constants/nlp-tagging';

/* TODO(nicksahler): Declare in machine, automatically route */
export function getBaseState(providerName, section) {
  let baseState = 'smallTalk.start';
  if (providerName === PROVIDERS.ASKDARCEL) {
    baseState = 'askDarcel.start';
  } else if (providerName === PROVIDERS.BENEFITKITCHEN) {
    baseState = 'benefitKitchen.start';
  } else if (providerName === PROVIDERS.EVERYONEON) {
    baseState = 'everyoneOn.start';
  } else if (providerName === PROVIDERS.USVOTEFOUNDATION) {
    baseState = 'usVoteFoundation.start';
  }
  if (section === 'machine') {
    return baseState.split('.')[0];
  } else if (section === 'state') {
    return baseState.split('.')[1];
  }
  return baseState;
}

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

export function getOrgNameFromConstituentEntry(constituent) {
  let entryOrganizationName;
  if (constituent.facebookEntry && constituent.facebookEntry.organization) {
    entryOrganizationName = constituent.facebookEntry.organization.name;
  } else if (constituent.smsEntry && constituent.smsEntry.organization) {
    entryOrganizationName = constituent.smsEntry.organization.name;
  }
  return entryOrganizationName;
}
