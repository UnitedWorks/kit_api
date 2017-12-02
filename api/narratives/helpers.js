import { pointPolygonCollision, pointCircleCollision } from '../utils/collision';
import * as PROVIDERS from '../constants/providers';
import KitClient from './clients/kit-client';
import * as TAGS from '../constants/nlp-tagging';
import * as INTEGRATIONS from '../constants/integrations';
import * as elementTemplates from './templates/elements';
import * as replyTemplates from './templates/quick-replies';
import { i18n } from './templates/messages';
import { getCategoryFallback } from '../knowledge-base/helpers';
import EmailService from '../utils/email';
import { EventTracker } from '../utils/event-tracking';
import * as env from '../env';
import { shuffle } from '../utils';
import shoutOutLogic from '../shouts/logic';
import { paramsToPromptSteps } from '../shouts/helpers';
import { getIntegrations } from '../integrations/helpers';

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

function missingQuestionEmail(representatives, session, question) {
  const repEmails = [];
  representatives.forEach((rep) => {
    repEmails.push({ name: rep.name, email: rep.email });
  });
  const emailMessage = `<b>"${question.question}"</b> ... was asked by a constituent but we don't seem to have an answer!<br/><br/><a href="${env.getDashboardRoot()}/answer?organization_id=${session.get('organization').id}&knowledge_question_id=${question.id}" target="_blank">Create an Answer!</a><br><br> If you have questions, send <a href="mailto:mark@mayor.chat">us</a> an email!`;
  new EmailService().send(`🤖 Missing Answer for "${question.question}" QID:${question.id} OID:${session.get('organization').id}`, emailMessage, repEmails, {
    organization_id: session.get('organization').id,
    knowledge_question_id: question.id,
  });
}

/* TODO(nicksahler) Move this all to higher order answering */
export async function fetchAnswers(intent, session) {
  const entities = session.snapshot.nlp.entities;
  /*TODO(nicksahler) Move this higher up (into the filter argument) to clean + validate [wit makes this prone to crashing] */
  const { question, answers, altQuestions } = await new KitClient({ organization: session.get('organization') }).getAnswer(intent).then(answerGroup => answerGroup);

  /*
   * If alternative questions, respond with those
   */
  if (altQuestions) {
    session.messagingClient.addToQuene('Can you give me a bit more detail? For example:');
    session.messagingClient.addToQuene(randomPick(altQuestions, 4).map(a => a.question).join(' '));
    return session.messagingClient.runQuene().then(() => session.getBaseState());
  /*
   * If no answers, run default shout out, integration, or fallback
   */
  } else if (!answers || (!answers.text && !answers.actions && !answers.places &&
    !answers.services && !answers.persons && !answers.feeds)) {
    const shoutOutTemplate = shoutOutLogic.ready[intent];
    const fallback = await getCategoryFallback([intent.split('.')[0]], session.get('organization').id).then(fbd => fbd);
    // Check Shout Out
    if (shoutOutTemplate) {
      // If Integration Overriding Shout Out Exists, run it
      const hasSeeClickFix = await getIntegrations({ organization: { id: session.get('organization').id } })
        .then((ints) => {
          const filtered = ints.filter(i => i.label === INTEGRATIONS.SEE_CLICK_FIX);
          return filtered[0] && filtered[0].enabled;
        });
      if (hasSeeClickFix) {
        session.messagingClient.addAll([
          i18n('see_click_fix'),
          elementTemplates.SeeClickFixTemplate,
        ], replyTemplates.evalHelpfulAnswer);
        session.messagingClient.runQuene();
        return session.getBaseState();
      // If a default Shout Out exists, run it
      }
      const actionObj = { shout_out: intent, params: paramsToPromptSteps(shoutOutTemplate.params) };
      session.set('action', actionObj);
      missingQuestionEmail(fallback.representatives, session, question);
      return 'action.waiting_for_response';
    }
    // See if we have fallback persons
    if (fallback.persons.length === 0) {
      session.messagingClient.addToQuene(i18n('dont_know'));
      EventTracker('answer_sent', { session, question }, { status: 'failed' });
    } else {
      // If we have fallback, list names and templates
      let compiledPersons = '';
      fallback.persons.forEach((person, index, arr) => {
        if (index === 0) {
          compiledPersons = compiledPersons.concat(person.name);
        } else if (arr.length - 1 === index) {
          compiledPersons = compiledPersons.concat(`, or ${person.name}`);
        } else {
          compiledPersons = compiledPersons.concat(`, ${person.name}`);
        }
      });
      session.messagingClient.addToQuene(i18n('dont_know', { tryPersoning: compiledPersons }));
      // Give templates
      session.messagingClient.addToQuene({
        type: 'template',
        templateType: 'generic',
        elements: fallback.persons.map(
          person => elementTemplates.genericPerson(person)),
      });
      EventTracker('answer_sent', { session, question }, { status: 'fallback' });
    }
    // EMAIL: See if have a representative we can send this to
    if (question && fallback.representatives.length > 0) {
      missingQuestionEmail(fallback.representatives, session, question);
    }
    // Run Message
    return session.messagingClient.runQuene().then(() => session.getBaseState());
  }
  EventTracker('answer_sent', { session, question }, { status: 'available' });

  /*
   * WE HAVE ANSWERS
   */
  let requestLocation = false;
  const timelyServices = (answers.services || []).filter(s => s.availabilitys && s.availabilitys.length > 0);
  const timelyFacilities = (answers.places || []).filter(s => s.availabilitys && s.availabilitys.length > 0);
  // If any services/places with availabilitys are in
  if (timelyServices.length > 0 || timelyFacilities.length > 0) {
    // If we have text, don't forget to include still
    // and we have datetime, validate whether or not its available
    const availableEntities = answers.services.filter(entity => KitClient.entityAvailabilityToText('service', entity, { datetime: entities[TAGS.DATETIME], constituentAttributes: session.get('attributes') }))
      .concat(answers.places.filter(entity => KitClient.entityAvailabilityToText('place', entity, { datetime: entities[TAGS.DATETIME], constituentAttributes: session.get('attributes') })));
    const locationServices = timelyServices.filter(s => s.availabilitys.filter(a => a.geo).length > 0);
    // If we're going to need a location, abort entirely and set default constituent location
    if (locationServices.length > 0 && (!session.get('attributes') || !session.get('attributes').default_location)) {
      session.messagingClient.addToQuene(i18n('get_home_location', { name: locationServices[0].name }), [replyTemplates.location, replyTemplates.exit]);
      requestLocation = true;
    } else {
      // and we dont have datetime or nothing available, mention availiabilities on each entity
      session.messagingClient.addAll(KitClient.genericTemplateFromAnswers({
        ...answers,
        services: answers.services,
        places: answers.places,
      }), replyTemplates.evalHelpfulAnswer);
      // If none available, say ___ is unavailable at that time (and then articulate schedules)
      const entityAvailabilities = [
        (availableEntities.length === 0 ? "I don't see anything available then" : null),
        ...answers.services.map(entity => KitClient.entityAvailabilityToText('service', entity, { datetime: entities[TAGS.DATETIME], constituentAttributes: session.get('attributes') }) || `${entity.name} is not available.`),
        ...answers.places.map(entity => KitClient.entityAvailabilityToText('place', entity, { datetime: entities[TAGS.DATETIME], constituentAttributes: session.get('attributes') }) || `${entity.name} is not open.`),
      ].filter(text => text);
      if (entityAvailabilities.length > 0) session.messagingClient.addToQuene(entityAvailabilities.join('. '), replyTemplates.evalHelpfulAnswer);
    }
  // Otherwise, mention all assets as usual
  } else {
    session.messagingClient
      .addAll(KitClient.genericTemplateFromAnswers(answers), replyTemplates.evalHelpfulAnswer);
  }

  /*
   * DONE
   */
  return session.messagingClient.runQuene().then(() => {
    // If we need a location, push user to setup machine
    if (requestLocation) {
      session.requestLocation();
      return;
    // If we have a shout out, run it
    } else if (answers.actions && answers.actions.shout_out) {
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
