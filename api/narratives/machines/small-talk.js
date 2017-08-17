import axios from 'axios';
import { logger } from '../../logger';
import { nlp } from '../../services/nlp';
import { getConstituentTasks } from '../../tasks/helpers';
import SlackService from '../../services/slack';
import Mixpanel from '../../services/event-tracking';
import { fetchAnswers, randomPick } from '../helpers';
import { getCategoryFallback } from '../../knowledge-base/helpers';
import * as elementTemplates from '../templates/elements';
import * as ATTRIBUTES from '../../constants/attributes';
import { TYPE_MAP } from '../../constants/tasks';

/* TODO(nicksahler) until I build the full i18n class */
const i18n = (key, inserts = {}) => {
  const translations = {
    intro_hello: `Hey${inserts.firstName ? ` ${inserts.firstName}` : ''}!`,
    intro_information: `Can I help you find something? Ask me any questions about ${inserts.organizationName ? `${inserts.organizationName} ` : 'local '}government!`,
    bot_apology: `Sorry, I wasn't expeting that answer or may have misunderstood. ${inserts.appendQuestion ? inserts.appendQuestion : ''}`,
  };
  return translations[key];
};

export default {
  init: {
    async enter() {
      let botName;
      let firstName;
      let pictureUrl = 'https://scontent-lga3-1.xx.fbcdn.net/v/t31.0-8/16422989_187757401706018_5896478987148979475_o.png?oh=e1edeead1710b85f3d42e669685f3d59&oe=590603C2';
      if (this.snapshot.constituent.facebookEntry) {
        botName = this.snapshot.constituent.facebookEntry.intro_name ||
          this.snapshot.constituent.facebookEntry.name;
        if (this.snapshot.constituent.facebookEntry.intro_picture_url) {
          pictureUrl = this.snapshot.constituent.facebookEntry.intro_picture_url;
        }
        firstName = await axios.get(`https://graph.facebook.com/v2.6/${this.snapshot.constituent.facebook_id}`, {
          params: {
            fields: 'first_name',
            access_token: this.snapshot.constituent.facebookEntry.access_token,
          },
        }).then(res => res.data.first_name);
      } else if (this.snapshot.constituent.smsEntry) {
        botName = this.snapshot.constituent.smsEntry.intro_name ||
          this.snapshot.constituent.smsEntry.name;
        if (this.snapshot.constituent.smsEntry.intro_picture_url) {
          pictureUrl = this.snapshot.constituent.smsEntry.intro_picture_url;
        }
      }
      const templates = {
        type: 'template',
        templateType: 'generic',
        elements: [
          elementTemplates.genericWelcome(pictureUrl, this.get('organization').name),
          elementTemplates.genericVotingAndElections,
          elementTemplates.genericSanitation,
          elementTemplates.genericCommuter,
          elementTemplates.genericBusiness,
          elementTemplates.genericRenter,
          elementTemplates.genericNewResident,
        ],
      };
      this.messagingClient.addToQuene(i18n('intro_hello', { firstName }));
      this.messagingClient.addToQuene(templates);
      this.messagingClient.addToQuene(i18n('intro_information', { organizationName: this.get('organization').name }));
      return this.messagingClient.runQuene().then(() => {
        if (!this.get('organization')) return this.stateRedirect('location', 'smallTalk.start');
        return 'start';
      });
    },
  },

  what_can_i_do: {
    enter() {
      const elements = [
        elementTemplates.genericVotingAndElections,
      ];
      // Add elements depending on constituent attributes
      if (!this.get('attributes')) this.set('attributes', {});
      // Housing
      if (this.get('attributes').housing === ATTRIBUTES.HOUSING_OWNER) {
        elements.unshift(elementTemplates.genericDocumentation);
        elements.unshift(elementTemplates.genericSanitation);
      } else if (this.get('attributes').housing === ATTRIBUTES.HOUSING_TENANT) {
        elements.push(elementTemplates.genericBenefits);
        elements.unshift(elementTemplates.genericRenter);
      } else if (this.get('attributes').housing === ATTRIBUTES.HOUSING_HOMELESS) {
        elements.unshift(elementTemplates.genericBenefits);
        elements.unshift(elementTemplates.genericAssistance);
      } else {
        elements.unshift(elementTemplates.genericDocumentation);
        elements.unshift(elementTemplates.genericSanitation);
        elements.push(elementTemplates.genericBenefits);
        elements.push(elementTemplates.genericAssistance);
      }
      // Business
      if (this.get('attributes').business_owner || this.get('attributes').business_owner == null) {
        elements.unshift(elementTemplates.genericBusiness);
      }
      elements.unshift(elementTemplates.genericCommuter);
      elements.unshift(elementTemplates.genericNewResident);
      this.messagingClient.addToQuene({
        type: 'template',
        templateType: 'generic',
        elements,
      });
      this.messagingClient.addToQuene('Here is what I think might be helpful for you. Feel free to ask me anything about local government or your community! :)');
      return this.messagingClient.runQuene().then(() => 'start');
    },
  },

  // TODO(nicksahler): Move to init
  start: {
    message() {
      if (!this.snapshot.input.payload.text && this.snapshot.input.payload.payload) {
        this.snapshot.input.payload.text = this.snapshot.input.payload.payload.replace(/([A-Z])/g, ' $1').trim();
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

          'voting.deadlines': 'voting.votingDeadlines',
          'voting.elections': 'voting.electionSchedule',
          'voting.registration.get': 'voting.voterRegistrationGet',
          'voting.registration.check': 'voting.voterRegistrationCheck',
          'voting.polls.find': 'voting.pollInfo',
          'voting.id': 'voting.voterIdRequirements',
          'voting.eligibility': 'voting.stateVotingRules',
          'voting.sample_ballot': 'voting.sampleBallot',
          'voting.absentee_ballot': 'voting.absenteeVote',
          'voting.early': 'voting.earlyVoting',
          'voting.problem': 'voting.voterProblem',
          'voting.assistance': 'voting.voterAssistance',

          'social_services.shelters': 'socialServices.waiting_shelter_search',
          'social_services.food_assistance': 'socialServices.waiting_food_search',
          'social_services.hygiene': 'socialServices.waiting_hygiene_search',

          'health_medicine.clinics': 'health.waiting_clinic_search',

          'education_employment.employment_job_training': 'employment.waiting_job_training',

          'interaction.tasks.create': 'prompt.loading_prompt',
          'interaction.tasks.get': 'get_tasks',

          'settings.locality.change': 'setup.reset_organization',
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
        FREQ_QUESTION_LIST: 'resident_question_list',
        FREQ_SERVICE_LIST: 'resident_service_list',
        FREQ_BUSINESS_QUESTIONS_LIST: 'business_questions_list',
        FREQ_BUSINESS_REQUIREMENTS_LIST: 'business_requirements_list',
        ANSWER_HELPFUL: 'eval.answer_helpful',
        ANSWER_NOT_HELPFUL: 'eval.answer_not_helpful',
      }[this.snapshot.input.payload.payload];
      if (!goTo) return this.input('message');
      return goTo;
    },
  },

  resident_question_list() {
    return this.messagingClient.send({ type: 'template', templateType: 'generic', elements: elementTemplates.genericNewResidentFAQList })
      .then(() => 'start');
  },

  resident_service_list() {
    return this.messagingClient.send({ type: 'template', templateType: 'generic', elements: elementTemplates.genericNewResidentServicesList })
      .then(() => 'start');
  },

  business_questions_list() {
    return this.messagingClient.send({ type: 'template', templateType: 'generic', elements: elementTemplates.genericBusinessQuestions })
      .then(() => 'start');
  },

  business_requirements_list() {
    return this.messagingClient.send({ type: 'template', templateType: 'generic', elements: elementTemplates.genericBusinessRequirements })
      .then(() => 'start');
  },

  get_tasks() {
    return getConstituentTasks(this.snapshot.constituent.id).then((tasks) => {
      if (tasks.length > 0) {
        tasks.forEach((task) => {
          const message = `#${task.id} - ${TYPE_MAP[task.type]} (${task.status})`;
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
    Mixpanel.track('constituent_input_failure', {
      distinct_id: this.snapshot.constituent.id,
      constituent_id: this.snapshot.constituent.id,
      organization_id: this.get('organization').id,
      interface: this.messagingClient.provider,
    });
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
      labels.push('general');
    } else {
      this.snapshot.nlp.entities.category_keywords.forEach(entity => labels.push(entity.value));
    }
    return getCategoryFallback(labels, this.snapshot.organization_id).then((fallbackData) => {
      // See if we have fallback contacts
      if (fallbackData.contacts.length === 0) {
        this.messagingClient.addToQuene('Unfortunately, I don\'t have an answer :(');
      } else {
        // If we do, templates!
        this.messagingClient.addToQuene(':( I don\'t have an answer, but try reaching out to these folks:');
        this.messagingClient.addToQuene({
          type: 'template',
          templateType: 'generic',
          elements: fallbackData.contacts.map(contact => elementTemplates.genericContact(contact)),
        });
      }
      return this.messagingClient.runQuene().then(() => 'start');
    }).catch((err) => {
      logger.error(err);
      return 'start';
    });
  },
};

export const persistentMenu = [{
  locale: 'default',
  call_to_actions: [{
    title: '🔦 Quick Questions',
    type: 'nested',
    call_to_actions: [{
      title: '📍 Common Questions',
      type: 'nested',
      call_to_actions: [{
        type: 'postback',
        title: 'Get Trash Schedule',
        payload: 'Get Trash Schedule',
      }, {
        type: 'postback',
        title: 'Get Recycling Schedule',
        payload: 'Get Recycling Schedule',
      }, {
        type: 'postback',
        title: 'Get Parking Schedule',
        payload: 'Get Parking Schedule',
      }, {
        type: 'postback',
        title: 'Are Schools Open Tomorrow?',
        payload: 'Are Schools Open Tomorrow?',
      }, {
        type: 'postback',
        title: 'Deadlines I Should Know Of',
        payload: 'Deadlines I Should Know Of',
      }],
    }, {
      title: '🚨 Local Gov Services',
      type: 'nested',
      call_to_actions: [{
        type: 'postback',
        title: 'Upcoming Town Meetings',
        payload: 'Upcoming Town Meetings',
      }, {
        type: 'postback',
        title: 'When Are Taxes Due?',
        payload: 'When Are Taxes Due?',
      }, {
        type: 'postback',
        title: 'Get Marriage Certificate Copy',
        payload: 'Get Marriage Certificate Copy',
      }, {
        type: 'postback',
        title: 'Get Pet License',
        payload: 'Get Pet License',
      }, {
        type: 'postback',
        title: 'Get Copy of a Deed',
        payload: 'Get Copy of a Deed',
      }],
    }, {
      title: '📅 Voting and Elections',
      type: 'nested',
      call_to_actions: [{
        type: 'postback',
        title: 'Upcoming Elections',
        payload: 'Upcoming Elections',
      }, {
        type: 'postback',
        title: 'Register to Vote',
        payload: 'Register To Vote',
      }, {
        type: 'postback',
        title: 'Voter ID Requirements',
        payload: 'Voter ID Requirements',
      }, {
        type: 'postback',
        title: 'Early Voting Rules',
        payload: 'Early Voting Rules',
      }, {
        type: 'postback',
        title: 'Problem at Polls',
        payload: 'Problem At Polls',
      }],
    }, {
      title: '🔔 Employment and Benefits',
      type: 'nested',
      call_to_actions: [{
        type: 'postback',
        title: 'Benefits Screener',
        payload: 'Benefits Screener',
      }, {
        type: 'postback',
        title: 'Report Wage Theft',
        payload: 'Report Wage Theft',
      }, {
        type: 'postback',
        title: 'Job Assistance',
        payload: 'Job Assistance',
      }],
    }, {
      title: '❤️ Immediate Assistance',
      type: 'nested',
      call_to_actions: [{
        type: 'postback',
        title: 'Find a Shelter',
        payload: 'Find a Shelter',
      }, {
        type: 'postback',
        title: 'Find Health Clinic',
        payload: 'Find Health Clinic',
      }, {
        type: 'postback',
        title: 'Find a Washroom',
        payload: 'Find a Washroom',
      }],
    }],
  }, {
    title: '🎯 Quick Actions',
    type: 'nested',
    call_to_actions: [{
      title: '🔨 Report a Problem',
      type: 'nested',
      call_to_actions: [{
        type: 'postback',
        title: 'Report Pothole',
        payload: 'Report Pothole',
      }, {
        type: 'postback',
        title: 'Report Broken Sidewalk',
        payload: 'Report Broken Sidewalk',
      }, {
        type: 'postback',
        title: 'Report Broken Sign',
        payload: 'Report Broken Sign',
      }, {
        type: 'postback',
        title: 'Report Light Outage',
        payload: 'Report Light Outage',
      }, {
        type: 'postback',
        title: 'Report General Problem',
        payload: 'Report General Problem',
      }],
    }, {
      title: '🔧 Request a Service',
      type: 'nested',
      call_to_actions: [{
        type: 'postback',
        title: 'Request Bulk Pickup',
        payload: 'Request Bulk Pickup'
      }, {
        type: 'postback',
        title: 'Request Parking Permit',
        payload: 'Request Parking Permit'
      }, {
        type: 'postback',
        title: 'Request Disability Tags',
        payload: 'Request Disability Tags'
      }, {
        type: 'postback',
        title: 'Request Building Inspection',
        payload: 'Request Building Inspection'
      }, {
        type: 'postback',
        title: 'Request Fire Inspection',
        payload: 'Request Fire Inspection'
      }],
    }, {
      type: 'postback',
      title: '📥 View My Requests',
      payload: 'GET_TASKS',
    }],
  }, {
    title: '🔮 Help',
    type: 'nested',
    call_to_actions: [{
      type: 'postback',
      title: 'What can I ask?',
      payload: 'What can I ask?',
    }, {
      title: 'Language',
      type: 'nested',
      call_to_actions: [{
        type: 'postback',
        title: 'Change language to English',
        payload: 'Change language to English',
      }, {
        type: 'postback',
        title: 'Cambiar el idioma al Espanol',
        payload: 'Change Language To Espanol',
      }],
    }, {
      type: 'postback',
      title: 'Leave Feedback',
      payload: 'Leave Feedback',
    }, {
      type: 'web_url',
      title: 'Want your own bot?',
      url: 'https://mayor.chat',
      webview_height_ratio: 'tall',
    }],
  }],
}];
