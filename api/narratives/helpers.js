import * as PROVIDERS from '../constants/providers';
import KitClient from './clients/kit-client';
import * as TAGS from '../constants/nlp-tagging';
import * as elementTemplates from './templates/elements';
import * as replyTemplates from './templates/quick-replies';
import { i18n } from './templates/messages';
import { getCategoryFallback } from '../knowledge-base/helpers';
import EmailService from '../services/email';
import Mixpanel from '../services/event-tracking';
import * as env from '../env';

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
      if (!answers || (!answers.text && !answers.prompt && answers.facilities.length === 0 &&
        answers.services.length === 0 && answers.contacts.length === 0)) {
        return getCategoryFallback([intent.split('.')[0]], session.get('organization').id)
          .then((fallbackData) => {
            // See if we have fallback contacts
            if (fallbackData.contacts.length === 0) {
              session.messagingClient.addToQuene(i18n('dont_know'));
              Mixpanel.track('answer_sent', {
                distinct_id: session.snapshot.constituent.id,
                constituent_id: session.snapshot.constituent.id,
                organization_id: session.get('organization').id,
                knowledge_category_id: question.knowledge_category_id,
                question_id: question.id,
                status: 'failed',
                interface: session.messagingClient.provider,
              });
            } else {
              // If we do, templates!
              session.messagingClient.addToQuene(i18n('dont_know'));
              // Compile names to look nice
              let compiledContacts = 'Until then please contact my colleagues for more help: ';
              fallbackData.contacts.forEach((contact, index, arr) => {
                if (index === 0) {
                  compiledContacts = compiledContacts.concat(`${contact.name}${contact.phone_number ? ` (${contact.phone_number})` : ''}`);
                } else if (index === arr.length - 1) {
                  compiledContacts = compiledContacts.concat(`, and ${contact.name}${contact.phone_number ? ` (${contact.phone_number})` : ''}`);
                } else {
                  compiledContacts = compiledContacts.concat(`, ${contact.name}${contact.phone_number ? ` (${contact.phone_number})` : ''}`);
                }
              });
              session.messagingClient.addToQuene(compiledContacts);
              // Give templates
              session.messagingClient.addToQuene({
                type: 'template',
                templateType: 'generic',
                elements: fallbackData.contacts.map(
                  contact => elementTemplates.genericContact(contact)),
              }, replyTemplates.evalHelpfulAnswer);
              Mixpanel.track('answer_sent', {
                distinct_id: session.snapshot.constituent.id,
                constituent_id: session.snapshot.constituent.id,
                organization_id: session.get('organization').id,
                knowledge_category_id: question ? question.knowledge_category_id : null,
                question_id: question ? question.id : null,
                status: 'fallback',
                interface: session.messagingClient.provider,
              });
            }
            // EMAIL: See if have a representative we can send this to
            if (fallbackData.representatives.length > 0) {
              const repEmails = [];
              fallbackData.representatives.forEach((rep) => {
                repEmails.push({ name: rep.name, email: rep.email });
              });
              const emailMessage = `<b>"${question.question}"</b> ... was asked by a constituent but we don't seem to have an answer!<br/><br/><a href="${env.getDashboardRoot()}/interfaces/answer?organization_id=${session.get('organization').id}&question_id=${question.id}" target="_blank">Create an Answer!</a><br><br> If you have questions, send <a href="mailto:mark@mayor.chat">us</a> an email!`;
              new EmailService().send(`🤖 Missing Answer for "${question.question}" QID:${question.id} OID:${session.get('organization').id}`, emailMessage, repEmails, {
                organization_id: session.get('organization').id,
                question_id: question.id,
              });
            }
            // If we didn't provide any info, don't bother asking if it was helpful
            if (fallbackData.representatives.length > 0 || fallbackData.contacts.length > 0) {
              session.messagingClient.addToQuene('Was this helpful?', [...replyTemplates.evalHelpfulAnswer]);
            }
            // Run Message
            return session.messagingClient.runQuene().then(() => session.getBaseState());
          });
      }
      // Otherwise, proceed with answers
      Mixpanel.track('answer_sent', {
        distinct_id: session.snapshot.constituent.id,
        constituent_id: session.snapshot.constituent.id,
        organization_id: session.get('organization').id,
        knowledge_category_id: question.knowledge_category_id,
        question_id: question.id,
        status: 'available',
        interface: session.messagingClient.provider,
      });
      if (entities && entities[TAGS.DATETIME]) {
        session.messagingClient.addAll(KitClient.dynamicAnswer(answers, entities[TAGS.DATETIME]),
          replyTemplates.evalHelpfulAnswer);
      } else if (schedule && schedule === 'day') {
        // THIS TOTALLY BREAKS the ELSE statement
        // If we have a static answer for something that can be dynamic, we never hit the else
        session.messagingClient.addAll(KitClient.dynamicAnswer(answers),
          replyTemplates.evalHelpfulAnswer);
      } else {
        session.messagingClient.addAll(KitClient.staticAnswer(answers),
          replyTemplates.evalHelpfulAnswer);
      }
      return session.messagingClient.runQuene().then(() => {
        // If we have a prompt, prompt user about it
        if (answers.prompt && answers.prompt.steps.length > 0) {
          const promptObj = {
            ...answers.prompt,
            name: answers.prompt.name || question.question,
          };
          if (answers.category) promptObj.category = answers.category;
          session.set('prompt', promptObj);
          return 'prompt.waiting_for_answer';
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
