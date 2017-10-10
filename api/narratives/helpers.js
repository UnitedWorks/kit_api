import { pointPolygonCollision, pointCircleCollision } from '../utils/collision';
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
import { shuffle } from '../utils';
import { logger } from '../logger';
import shoutOutLogic from '../shouts/logic';
import { paramsToPromptSteps } from '../shouts/helpers';

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

export function randomPick(array = [], num = 1) {
  if (num !== 1) {
    return shuffle(array).slice(0, num);
  }
  return array[Math.floor(Math.random() * array.length)];
}

export function geoCheck(geo, constituentPosition) {
  let passesGeoCheck = false;
  if (geo && geo[0]) {
    geo.forEach((boundary) => {
      if (boundary.length) {
        // If Polygon
        const boundaryPolygon = boundary[0].map(c => [c.lat, c.lng]);
        if (pointPolygonCollision(constituentPosition, boundaryPolygon)) passesGeoCheck = true;
      } else if (boundary.radius) {
        // If Circle
        if (pointCircleCollision(constituentPosition, [boundary.lat, boundary.lng], boundary.radius)) passesGeoCheck = true;
      }
    });
  }
  return passesGeoCheck;
}

/* TODO(nicksahler) Move this all to higher order answering */
export async function fetchAnswers(intent, session) {
  const entities = session.snapshot.nlp.entities;
  /*TODO(nicksahler) Move this higher up (into the filter argument) to clean + validate [wit makes this prone to crashing] */
  const { question, answers, altQuestions } = await new KitClient({ organization: session.get('organization') }).getAnswer(intent).then(answerGroup => answerGroup);
  // If alternative questions, respond with those
  if (altQuestions) {
    session.messagingClient.addToQuene('Can you give me a bit more detail? For example:');
    session.messagingClient.addToQuene(randomPick(altQuestions, 4).map(a => a.question).join(' '));
    return session.messagingClient.runQuene().then(() => session.getBaseState());
  // If no answers, run fallback
  } else if (!answers || (!answers.text && !answers.actions && !answers.facilities &&
    !answers.services && !answers.contacts && !answers.feeds)) {
    const fallbackData = await getCategoryFallback([intent.split('.')[0]], session.get('organization').id).then(fbd => fbd);
    // See if we have fallback contacts
    if (fallbackData.contacts.length === 0) {
      session.messagingClient.addToQuene(i18n('dont_know'));
      try {
        Mixpanel.track('answer_sent', {
          distinct_id: session.snapshot.constituent.id,
          constituent_id: session.snapshot.constituent.id,
          organization_id: session.get('organization').id,
          knowledge_category_id: question ? question.knowledge_category_id : null,
          question_id: question ? question.id : null,
          status: 'failed',
          interface: session.messagingClient.provider,
        });
      } catch (e) {
        logger.error(e);
      }
    } else {
      // If we do, templates!
      session.messagingClient.addToQuene(i18n('dont_know'));
      // Compile names to look nice
      let compiledContacts = 'Until then please contact my colleagues for more help: ';
      fallbackData.contacts.forEach((contact, index) => {
        if (index === 0) {
          compiledContacts = compiledContacts.concat(contact.name);
        } else {
          compiledContacts = compiledContacts.concat(`, ${contact.name}`);
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
      try {
        Mixpanel.track('answer_sent', {
          distinct_id: session.snapshot.constituent.id,
          constituent_id: session.snapshot.constituent.id,
          organization_id: session.get('organization').id,
          knowledge_category_id: question ? question.knowledge_category_id : null,
          question_id: question ? question.id : null,
          status: 'fallback',
          interface: session.messagingClient.provider,
        });
      } catch (e) {
        logger.error(e);
      }
    }
    // EMAIL: See if have a representative we can send this to
    if (question && fallbackData.representatives.length > 0) {
      const repEmails = [];
      fallbackData.representatives.forEach((rep) => {
        repEmails.push({ name: rep.name, email: rep.email });
      });
      const emailMessage = `<b>"${question.question}"</b> ... was asked by a constituent but we don't seem to have an answer!<br/><br/><a href="${env.getDashboardRoot()}/answer?organization_id=${session.get('organization').id}&question_id=${question.id}" target="_blank">Create an Answer!</a><br><br> If you have questions, send <a href="mailto:mark@mayor.chat">us</a> an email!`;
      new EmailService().send(`🤖 Missing Answer for "${question.question}" QID:${question.id} OID:${session.get('organization').id}`, emailMessage, repEmails, {
        organization_id: session.get('organization').id,
        question_id: question.id,
      });
    }
    // If we didn't provide any info, don't bother asking if it was helpful
    if (question && (fallbackData.representatives.length > 0 || fallbackData.contacts.length > 0)) {
      session.messagingClient.addToQuene('Was this helpful?', [...replyTemplates.evalHelpfulAnswer]);
    }
    // Run Message
    return session.messagingClient.runQuene().then(() => session.getBaseState());
  }
  // Otherwise, proceed with answers
  try {
    Mixpanel.track('answer_sent', {
      distinct_id: session.snapshot.constituent.id,
      constituent_id: session.snapshot.constituent.id,
      organization_id: session.get('organization').id,
      knowledge_category_id: question.knowledge_category_id,
      question_id: question.id,
      status: 'available',
      interface: session.messagingClient.provider,
    });
  } catch (e) {
    logger.error(e);
  }
  // Translate Entities to Templates/Text
  // If we have a datetime, filter out unavailable services/facilities
  if (entities[TAGS.DATETIME]) {
    session.messagingClient.addAll(KitClient.genericTemplateFromAnswers({
      ...answers,
      services: answers.services.filter(entity => KitClient.entityAvailabilityToText('service', entity, { datetime: entities[TAGS.DATETIME], constituentAttributes: session.get('attributes') })),
      facilities: answers.facilities.filter(entity => KitClient.entityAvailabilityToText('facility', entity, { datetime: entities[TAGS.DATETIME], constituentAttributes: session.get('attributes') })),
    }), replyTemplates.evalHelpfulAnswer);
  } else {
    session.messagingClient
      .addAll(KitClient.genericTemplateFromAnswers(answers), replyTemplates.evalHelpfulAnswer);
  }
  // Availability Checks on Facilities/Services (currently just time/location.
  // Constituent attributes should be a filtering factor on even static)
  const entityAvailabilities = [
    ...answers.services.map(entity => KitClient.entityAvailabilityToText('service', entity, { datetime: entities[TAGS.DATETIME], constituentAttributes: session.get('attributes') })).filter(s => s),
    ...answers.facilities.map(entity => KitClient.entityAvailabilityToText('facility', entity, { datetime: entities[TAGS.DATETIME], constituentAttributes: session.get('attributes') })).filter(s => s),
  ];
  if (entityAvailabilities.length > 0) {
    session.messagingClient.addAll(entityAvailabilities, replyTemplates.evalHelpfulAnswer);
  } else if (entityAvailabilities.length === 0 && !answers.events) {
    session.messagingClient.addToQuene('There doesn\'t seem to an available service or facility for that date/time.');
  }
  return session.messagingClient.runQuene().then(() => {
    // If we have a shout out, run it
    if (answers.actions && answers.actions.shout_out) {
      const actionObj = shoutOutLogic.all[answers.actions.shout_out];
      // Concert params to an array. Order isnt guarenteed to be preserved on obj
      actionObj.params = paramsToPromptSteps(actionObj.params);
      // If action matches, run it
      if (actionObj) {
        actionObj.shout_out = answers.actions.shout_out;
        session.set('action', actionObj);
        return 'action.waiting_for_response';
      }
    }
    // Otherwise end user back at start
    return session.getBaseState();
  });
}

export function getOrgNameFromConstituentEntry(constituent) {
  let entryOrganizationName;
  if (constituent.facebookEntry && constituent.facebookEntry.organization) {
    entryOrganizationName = constituent.facebookEntry.organization.name;
  } else if (constituent.smsEntry && constituent.smsEntry.organization) {
    entryOrganizationName = constituent.smsEntry.organization.name;
  }
  return entryOrganizationName;
}
