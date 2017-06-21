import * as PROVIDERS from '../constants/providers';
import KitClient from './clients/kit-client';
import * as TAGS from '../constants/nlp-tagging';
import * as elementTemplates from './templates/elements';
import * as replyTemplates from './templates/quick-replies';
import { getCategoryFallback } from '../knowledge-base/helpers';

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
export const fetchAnswers = (intent, session) => {
  const entities = session.snapshot.nlp.entities;
  /*TODO(nicksahler) Move this higher up (into the filter argument) to clean + validate [wit makes this prone to crashing] */
  const schedule = (entities.schedule && entities.schedule[0]) ? entities.schedule[0].value : null;

  return new KitClient({ organization: session.get('organization') })
    .getAnswer(intent).then(({ question, answers }) => {
      // If no answers, run fallback
      if (!answers || (!answers.text && !answers.survey && !answers.facilities.length &&
        !answers.services.length && !answers.contacts.length)) {
        return getCategoryFallback([intent.split('.')[0]], session.get('organization').id)
          .then((fallbackData) => {
            // See if we have fallback contacts
            if (fallbackData.contacts.length === 0) {
              session.messagingClient.addToQuene('I wish I had an answer :(');
            } else {
              // If we do, templates!
              session.messagingClient.addToQuene('Darn :( I don\'t have an answer, but try reaching out to these folks!');
              session.messagingClient.addToQuene({
                type: 'template',
                templateType: 'generic',
                elements: fallbackData.contacts.map(
                  contact => elementTemplates.genericContact(contact)),
              });
            }
            session.messagingClient.addToQuene('If you want, "Make a Request" and I will get you a response from a government employee ASAP!', replyTemplates.makeRequest);
            return session.messagingClient.runQuene().then(() => session.getBaseState());
          });
      }
      // Otherwise, proceed with answers
      if (entities && entities[TAGS.DATETIME]) {
        session.messagingClient.addAll(KitClient.dynamicAnswer(answers, entities[TAGS.DATETIME]));
      } else if (schedule && schedule === 'day') {
        // THIS TOTALLY BREAKS the ELSE statement
        // If we have a static answer for something that can be dynamic, we never hit the else
        session.messagingClient.addAll(KitClient.dynamicAnswer(answers));
      } else {
        KitClient.staticAnswer(answers).forEach((answer) => {
          session.messagingClient.addToQuene(answer);
        });
      }
      return session.messagingClient.runQuene().then(() => {
        // If we have a survey, prompt user about it
        if (answers.survey && answers.survey.questions.length > 0) {
          const surveyObj = {
            ...answers.survey,
            name: answers.survey.name || question.question,
          };
          if (answers.category) surveyObj.category = answers.category;
          session.set('survey', surveyObj);
          return 'survey.waiting_for_answer';
        }
        // Otherwise end user back at start
        return session.getBaseState();
      });
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

export function randomPick(array = []) {
  return array[Math.floor(Math.random() * array.length)];
}
