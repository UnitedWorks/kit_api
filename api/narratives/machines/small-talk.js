import { logger } from '../../logger';
import { nlp } from '../../services/nlp';
import { getConstituentTasks } from '../../tasks/helpers';
import SlackService from '../../services/slack';
import { EventTracker } from '../../services/event-tracking';
import { fetchAnswers, randomPick } from '../helpers';
import { getCategoryFallback } from '../../knowledge-base/helpers';
import * as elementTemplates from '../templates/elements';
import * as replyTemplates from '../templates/quick-replies';
import { i18n } from '../templates/messages';
import * as KNOWLEDGE_CONST from '../../constants/knowledge-base';

const intoTemplates = {
  type: 'template',
  templateType: 'generic',
  elements: [
    elementTemplates.genericSanitation,
    elementTemplates.genericEvents,
    elementTemplates.genericCommuter,
    elementTemplates.genericRenter,
    elementTemplates.genericVotingAndElections,
    elementTemplates.genericBusiness,
    elementTemplates.genericDirectory,
  ],
};

export default {
  init: {
    async enter() {
      let firstName;
      this.messagingClient.addToQuene(i18n('intro_hello', { firstName }));
      this.messagingClient.addToQuene(intoTemplates);
      this.messagingClient.addToQuene(i18n('intro_information', { organizationName: this.get('organization').name }), [replyTemplates.allNotificationsOn]);
      return this.messagingClient.runQuene().then(() => {
        if (!this.get('organization')) return this.stateRedirect('location', 'smallTalk.start');
        return 'start';
      });
    },
  },

  what_can_i_do: {
    enter() {
      this.messagingClient.addToQuene(intoTemplates);
      this.messagingClient.addToQuene('I can answer questions about your local government or your community. I can also reminder you about trash/recycling pickup, events, and the weather!', [replyTemplates.allNotificationsOn]);
      return this.messagingClient.runQuene().then(() => 'start');
    },
  },

  // TODO(nicksahler): Move to init
  start: {
    message() {
      if (!this.snapshot.input.payload.text && this.snapshot.input.payload.payload) {
        this.snapshot.input.payload.text = this.snapshot.input.payload.payload;
      }
      return nlp.message(this.snapshot.input.payload.text).then((nlpData) => {
        this.snapshot.nlp = nlpData;

        logger.info(nlpData);

        const entities = nlpData.entities;
        const intentMap = {
          'speech.help': 'what_can_i_do',
          'speech.greeting': 'personality.handle_greeting',
          'speech.thanks': 'personality.handle_thank_you',
          'speech.praise': 'personality.handle_praise',

          'personality.what_am_i': 'personality.what_am_i',
          'personality.chatbot_curiosity': 'personality.chatbot_curiosity',
          'personality.has_question': 'personality.has_question',
          'personality.makers': 'personality.makers',

          // benefits_internet: 'benefits-internet.init',

          'voting_elections_participation.absentee_ballot': 'voting_elections_participation.absentee_ballot',
          'voting_elections_participation.deadlines': 'voting_elections_participation.deadlines',
          'voting_elections_participation.elections': 'voting_elections_participation.elections',
          'voting_elections_participation.registration.request': 'voting_elections_participation.registration_request',
          'voting_elections_participation.registration.check': 'voting_elections_participation.registration_check',
          'voting_elections_participation.polls.search': 'voting_elections_participation.polls_search',
          'voting_elections_participation.identification': 'voting_elections_participation.identification',
          'voting_elections_participation.eligibility': 'voting_elections_participation.eligibility',
          'voting_elections_participation.sample_ballot': 'voting_elections_participation.sample_ballot',
          'voting_elections_participation.early': 'voting_elections_participation.early',
          'voting_elections_participation.blocking': 'voting_elections_participation.blocking',
          'voting_elections_participation.assistance': 'voting_elections_participation.assistance',

          'social_services.shelters': 'socialServices.waiting_shelter_search',
          'social_services.food_assistance': 'socialServices.waiting_food_search',
          'social_services.hygiene': 'socialServices.waiting_hygiene_search',

          'health_medicine.clinics': 'health.waiting_clinic_search',

          'education_employment.employment_job_training': 'employment.waiting_job_training',

          'interaction.tasks.status': 'get_tasks',

          'notifications': 'notifications',

          'search.knowledge_entity': 'search.knowledge_entity',
          'search.event': 'search.event',

          'settings.locality.change': 'setup.reset_organization',
          'settings.default_location': 'setup.default_location',
        };

        if (entities.intent && entities.intent[0]) {
          return Promise.resolve(intentMap[entities.intent[0].value] ||
            fetchAnswers(entities.intent[0].value, this));
        }
        return 'failed_request';
      });
    },

    action() {
      const goTo = {
        GET_TASKS: 'get_tasks',
        GET_STARTED: 'init',
        CHANGE_CITY: 'setup.reset_organization',
        ASK_OPTIONS: 'what_can_i_do',
        ANSWER_HELPFUL: 'eval.answer_helpful',
        ANSWER_NOT_HELPFUL: 'eval.answer_not_helpful',
      }[this.snapshot.input.payload.payload];
      if (!goTo) return this.input('message');
      return goTo;
    },
  },

  get_tasks() {
    return getConstituentTasks(this.snapshot.constituent.id).then((tasks) => {
      if (tasks.length > 0) {
        tasks.forEach((task) => {
          const message = `#${task.id} - ${task.status}`;
          this.messagingClient.addToQuene(message);
        });
        return this.messagingClient.runQuene().then(() => 'start');
      }
      this.messagingClient.send('Looks like you haven\'t made any requests yet!');
      return 'start';
    });
  },

  failed_request() {
    // Analytics & Notifications
    new SlackService({
      username: 'Misunderstood Request',
      icon: 'question',
    }).send(`>*Request Message*: ${this.snapshot.input.payload.text}\n>*Constituent ID*: ${this.snapshot.constituent.id}`);
    EventTracker('constituent_input_failure', { session: this });
    // Handle Failure
    const firstFailMessage = randomPick([
      'Oops! My circuits went haywire. Can you say that a different way?',
      'Hmm, I\'m not following. Can you rephrase that?',
    ]);
    // If first failure, ask for a repeat of question
    if (this.snapshot.state_machine_previous_state !== 'failed_request') {
      return this.messagingClient.send(firstFailMessage).then(() => 'start');
    }
    // If second failure, fetch resources to assist
    const labels = [];
    if (!this.snapshot.nlp.entities.category_keywords || this.snapshot.nlp.entities.category_keywords.length === 0) {
      labels.push(KNOWLEDGE_CONST.GENERAL_LABEL);
    } else {
      this.snapshot.nlp.entities.category_keywords.forEach(entity => labels.push(entity.value));
    }
    return getCategoryFallback(labels, this.snapshot.organization_id).then((fallbackData) => {
      // See if we have fallback contacts
      if (fallbackData.contacts.length === 0) {
        this.messagingClient.addToQuene(i18n('dont_know'));
      } else {
        // If we do, templates!
        this.messagingClient.addToQuene(i18n('dont_know'));
        // Compile names to look nice
        let compiledContacts = 'Until then please contact my colleagues for more help: ';
        fallbackData.contacts.forEach((contact, index, arr) => {
          if (index === 0) {
            compiledContacts = compiledContacts.concat(`${contact.name}${contact.phone_number ? ` (${contact.phone_number})` : ''}`);
          } else if (index === arr.length - 1) {
            compiledContacts = compiledContacts.concat(`, and ${contact.name}${contact.phone_number ? ` (${contact.phone_number})` : ''}.`);
          } else {
            compiledContacts = compiledContacts.concat(`, ${contact.name}${contact.phone_number ? ` (${contact.phone_number})` : ''}`);
          }
        });
        this.messagingClient.addToQuene(compiledContacts);
        // Give templates
        this.messagingClient.addToQuene({
          type: 'template',
          templateType: 'generic',
          elements: fallbackData.contacts.map(contact => elementTemplates.genericContact(contact)),
        }, replyTemplates.evalHelpfulAnswer);
      }
      return this.messagingClient.runQuene().then(() => 'start');
    }).catch((err) => {
      logger.error(err);
      return 'start';
    });
  },

  notifications() {
    const notifications = this.get('notifications') || {};
    const notificationType = this.snapshot.nlp.entities.notification_type ?
      this.snapshot.nlp.entities.notification_type[0].value : null;
    const newState = this.snapshot.nlp.entities.on_off ?
      this.snapshot.nlp.entities.on_off[0].value : null;
    // If no state, abort
    if (newState === null) return this.messagingClient.send('Sorry, I didn\'t catch whether you wanted to turn on or off a notification.').then(() => 'start');
    // If no type, set all off or on
    if (!notificationType) {
      if (newState === 'off') {
        notifications.sanitation_collection = false;
        notifications.events = false;
        notifications.weather = false;
        this.messagingClient.send('Reminders are turned off.', [replyTemplates.allNotificationsOn]);
      } else {
        notifications.sanitation_collection = true;
        notifications.events = true;
        notifications.weather = true;
        this.messagingClient.send('Remders are on!', [replyTemplates.allNotificationsOff]);
      }
    // Otherwise flip specific type
    } else {
      if (notificationType === 'weather') {
        notifications.weather = newState ? 'on' : 'off';
        this.messagingClient.send(`Weather reminders are ${notifications.weather}!`);
      } else if (notificationType === 'sanitation_collection') {
        notifications.sanitation_collection = newState ? 'on' : 'off';
        this.messagingClient.send(`Garbage/recycling collection reminders are ${notifications.sanitation_collection}!`);
      } else if (notificationType === 'events') {
        notifications.events = newState ? 'on' : 'off';
        this.messagingClient.send(`Event reminders are ${notifications.events}!`);
      }
    }
    this.set('notifications', notifications);
    return 'start';
  },
};
