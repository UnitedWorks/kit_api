import { logger } from '../../logger';
import { nlp } from '../../utils/nlp';
import { getConstituentTasks } from '../../tasks/helpers';
import { checkIntegration } from '../../integrations/helpers';
import * as INTEGRATIONS from '../../constants/integrations';
import SlackService from '../../utils/slack';
import { EventTracker } from '../../utils/event-tracking';
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
    elementTemplates.genericHousing,
    elementTemplates.genericVotingAndElections,
    // elementTemplates.genericBusiness,
    elementTemplates.genericDirectory,
  ],
};

export default {
  init: {
    async enter() {
      let firstName;
      this.messagingClient.addToQuene(i18n('intro_hello', { firstName }));
      this.messagingClient.addToQuene(intoTemplates);
      this.messagingClient.addToQuene(i18n('intro_information', { organizationName: this.snapshot.organization.name }), [replyTemplates.allNotificationsOn]);
      return this.messagingClient.runQuene().then(() => {
        if (!this.snapshot.organization) return this.stateRedirect('location', 'smallTalk.start');
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

          // benefits_internet: 'benefits-internet.init',

          'education_employment.employment_job_training': 'employment.waiting_job_training',

          'health_medicine.clinics': 'health.waiting_clinic_search',

          'interaction.tasks.status': 'get_tasks',

          'personality.what_am_i': 'personality.what_am_i',
          'personality.chatbot_curiosity': 'personality.chatbot_curiosity',
          'personality.has_question': 'personality.has_question',
          'personality.makers': 'personality.makers',
          'personality.age': 'personality.age',
          'personality.name': 'personality.name',
          'personality.weather': 'personality.weather',

          'search.knowledge_entity': 'search.knowledge_entity',
          'search.event': 'search.event',

          'settings.locality.update': 'setup.reset_organization', // Do we need this?
          'settings.location': 'setup.location', // Should there be an attribute setting machine?
          'settings.default_location': 'setup.location', // Temp while wit updates

          'social_services.shelters': 'socialServices.waiting_shelter_search',
          'social_services.food_assistance': 'socialServices.waiting_food_search',
          'social_services.hygiene': 'socialServices.waiting_hygiene_search',

          'speech.help': 'what_can_i_do',
          'speech.greeting': 'personality.handle_greeting',
          'speech.thanks': 'personality.handle_thank_you',
          'speech.praise': 'personality.handle_praise',
          'speech.frustration': 'personality.handle_frustration',

          'transportation_streets_sidewalks.snow.plowing': 'status.plowing',

          'notifications': 'notifications',

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

        };

        // Run if we have intent
        if (entities.intent && entities.intent[0]) {
          new SlackService({ username: 'Message', icon: 'envelope' })
            .send(`>*Con. ${this.snapshot.constituent_id}:* "${this.snapshot.input.payload.text}"`);
          return Promise.resolve(intentMap[entities.intent[0].value]
            || fetchAnswers(entities.intent[0].value, this));
        // If no intent but have place/search functions, return related entities
        } else if (entities.place_function || entities.service_function) {
          return Promise.resolve(intentMap['search.knowledge_entity']);
        }
        // Otherwise just fail
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

  async failed_request() {
    // Analytics & Notifications
    try {
      new SlackService({
        username: 'Misunderstood Request',
        icon: 'question',
      }).send(`>*Con. ${this.snapshot.constituent_id}:* "${this.snapshot.input.payload.text}"\n>*Org*: ${this.snapshot.organization.name} -- *Interface*: ${this.snapshot.constituent.facebookEntry ? 'Facebook' : 'Web'}`);
    } catch (e) {
      logger.error(e);
    }
    EventTracker('constituent_input_failure', { session: this });
    // Handle Failure
    const firstFailMessage = randomPick(['Not sure I understand. Can you rephrase that?']);
    // If first failure, ask for a repeat of question
    if (this.snapshot.state_machine_previous_state !== 'failed_request') {
      return this.messagingClient.send(firstFailMessage).then(() => 'start');
    }
    // If second failure, fetch resources to assist
    let categoryLabel = KNOWLEDGE_CONST.GENERAL_CATEGORY_LABEL;
    if (this.snapshot.nlp.entities.category_labels && this.snapshot.nlp.entities.category_labels.length > 0) {
      categoryLabel = this.snapshot.nlp.entities.category_labels[0].value;
    }
    return getCategoryFallback(categoryLabel, this.snapshot.organization_id).then((fallback) => {
      // If no fallback
      if (!fallback) {
        this.messagingClient.addToQuene(i18n('dont_know'));
      } else {
        // If we have fallback
        this.messagingClient.addToQuene(fallback.message ? fallback.message : i18n('dont_know'), replyTemplates.evalHelpfulAnswer);
        // Set template elements
        const elements = [];
        if (fallback.persons && fallback.persons.length > 0) fallback.persons.forEach(p => elements.push(elementTemplates.genericPerson(p)));
        if (fallback.phones && fallback.phones.length > 0) fallback.phones.forEach(p => elements.push(elementTemplates.genericPhone(p)));
        if (fallback.resources && fallback.resources.length > 0) fallback.resources.forEach(r => elements.push(elementTemplates.genericResource(r)));
        if (elements.length > 0) {
          this.messagingClient.addToQuene({
            type: 'template',
            templateType: 'generic',
            elements,
          }, replyTemplates.evalHelpfulAnswer);
        }
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
        notifications.alerts = false;
        this.messagingClient.send('Notifications are off. Let me whenever you want reminders about the weather, events, or collection again.', [replyTemplates.allNotificationsOn]);
      } else {
        notifications.sanitation_collection = true;
        notifications.events = true;
        notifications.weather = true;
        notifications.alerts = true;
        this.messagingClient.send('Reminders are on! You won\'t miss a beat now!', [replyTemplates.allNotificationsOff]);
      }
    // Otherwise flip specific type
    } else {
      if (notificationType === 'weather') {
        notifications.weather = newState === 'on';
        this.messagingClient.send(`Weather updates are ${notifications.weather ? 'on. I\'ll help you stay dry ☀' : 'off. Let me know if you want weahter updates again.'}`, !notifications.weather ? [replyTemplates.weatherOn] : null);
      } else if (notificationType === 'sanitation_collection') {
        notifications.sanitation_collection = newState === 'on';
        this.messagingClient.send(`Garbage/recycling reminders are ${notifications.sanitation_collection ? 'on. Collection day wont catch you by surprise again!' : 'off. Let me know when you want collection reminders again.'}`, !notifications.sanitation_collection ? [replyTemplates.sanitationOn] : null);
      } else if (notificationType === 'events') {
        notifications.events = newState === 'on';
        this.messagingClient.send(`Event reminders are ${notifications.events ? 'on. I\'ll keep you in the know.' : 'off. Feel free to ask for updates again at any time.'}`, !notifications.events ? [replyTemplates.eventsOn] : null);
      } else if (notificationType === 'alerts') {
        notifications.alerts = newState === 'on';
        this.messagingClient.send(`Priority updates are ${notifications.alerts ? 'on. Hope that your commute goes a bit smoother!' : 'off. Feel free to ask for them again anytime.'}`, !notifications.alerts ? [replyTemplates.alertsOn] : null);
      }
    }
    this.set('notifications', notifications);
    return 'start';
  },
};
