import { logger } from '../../logger';
import { nlp } from '../../services/nlp';
import * as CASE_CONSTANTS from '../../constants/cases';
import { getConstituentCases, createConstituentCase } from '../../cases/helpers';
import SlackService from '../../services/slack';
import { fetchAnswers } from '../helpers';
import { getCategoryEntities } from '../../knowledge-base/helpers';
import * as elementTemplates from '../templates/elements';
import * as replyTemplates from '../templates/quick-replies';
import * as ATTRIBUTES from '../../constants/attributes';

/* TODO(nicksahler) until I build the full i18n class */
const i18n = (key, inserts = {}) => {
  const translations = {
    intro_hello: `Hey there! :D I'm ${inserts.name ? `${inserts.name}, ` : ''}a chatbot connecting you to your local government!`,
    intro_information: 'I can answers your questions, record suggestions/complaints, find you government contracts, and more!',
    intro_survey_ask: 'We should get to know each other a little bit so I can be more helpful. Can I ask you some quick questions?',
    intro_survey_attribute_housing: 'Are you currently renting, an owner, or homeless?',
    intro_survey_attribute_new_resident: `Are you a new resident${inserts.organizationName ? ` to ${inserts.organizationName}` : ''}?`,
    intro_survey_attribute_business_owner: `Do you have a business${inserts.organizationName ? ` in ${inserts.organizationName}` : ''}?`,
    intro_survey_attribute_children: 'Do you have any young children in the schools here?',
    intro_survey_attribute_dogs_or_cats: 'Whats better... 🐱Cats or 🐶Dogs?',
    organization_confirmation: `You're interested in ${inserts.organizationName}, right?`,
    bot_apology: `Sorry, I wasn't expeting that answer or may have misunderstood. ${inserts.appendQuestion ? inserts.appendQuestion : ''}`,
  };
  return translations[key];
};

const basicRequestQuickReplies = [
  { content_type: 'text', title: 'What can I ask?', payload: 'What can I ask?' },
  { content_type: 'text', title: 'Upcoming Elections', payload: 'Upcoming Elections' },
  { content_type: 'text', title: 'Available Benefits', payload: 'Available Benefits' },
  { content_type: 'text', title: 'Raise an Issue', payload: 'MAKE_REQUEST' },
];

const housingRequestQuickReplies = [
  { content_type: 'text', title: 'Renting', payload: 'Renting' },
  { content_type: 'text', title: 'Own a Home', payload: 'Own A Home' },
  { content_type: 'text', title: 'Homeless', payload: 'Homeless' },
];

const petQuickReplies = [
  { content_type: 'text', title: 'Cats🐱', payload: 'Cats' },
  { content_type: 'text', title: 'Dogs🐶', payload: 'Dogs' },
];

export default {
  init: {
    enter() {
      let name;
      let pictureUrl = 'https://scontent-lga3-1.xx.fbcdn.net/v/t31.0-8/16422989_187757401706018_5896478987148979475_o.png?oh=e1edeead1710b85f3d42e669685f3d59&oe=590603C2';
      if (this.snapshot.constituent.facebookEntry) {
        name = this.snapshot.constituent.facebookEntry.intro_name ||
          this.snapshot.constituent.facebookEntry.name;
        if (this.snapshot.constituent.facebookEntry.intro_picture_url) {
          pictureUrl = this.snapshot.constituent.facebookEntry.intro_picture_url;
        }
      } else if (this.snapshot.constituent.smsEntry) {
        name = this.snapshot.constituent.smsEntry.intro_name ||
          this.snapshot.constituent.smsEntry.name;
        if (this.snapshot.constituent.smsEntry.intro_picture_url) {
          pictureUrl = this.snapshot.constituent.smsEntry.intro_picture_url;
        }
      }
      this.messagingClient.addAll([
        i18n('intro_hello', { name }),
        {
          type: 'image',
          url: pictureUrl,
        },
        i18n('intro_information'),
      ]);
      return this.messagingClient.runQuene().then(() => {
        if (!this.get('organization')) return this.stateRedirect('location', 'smallTalk.what_can_i_do');
        return 'waiting_for_intro_survey_confirmation';
      });
    },
  },

  waiting_for_intro_survey_confirmation: {
    enter() {
      this.messagingClient.send(i18n('intro_survey_ask'), replyTemplates.sureNoThanks);
    },
    message() {
      return nlp.message(this.snapshot.input.payload.text)
        .then((nlpData) => {
          this.snapshot.nlp = nlpData;
          const entities = nlpData.entities;
          if (entities.intent && entities.intent[0]) {
            if (entities.intent[0].value === 'speech_confirm') {
              return this.messagingClient.send('Great! :)').then(() => 'waiting_for_attribute_housing');
            } else if (entities.intent[0].value === 'speech_deny') {
              this.set('attributes', {});
              return 'what_can_i_do';
            }
          }
          this.messagingClient.send(i18n('bot_apology', { appendQuestion: i18n('intro_survey_ask') }), replyTemplates.sureNoThanks);
        });
    },
  },

  waiting_for_attribute_housing: {
    enter() {
      this.messagingClient.send(i18n('intro_survey_attribute_housing'), housingRequestQuickReplies);
    },
    message() {
      return nlp.message(this.snapshot.input.payload.text)
        .then((nlpData) => {
          this.snapshot.nlp = nlpData;
          const entities = nlpData.entities;
          if (entities.attribute && entities.attribute[0]) {
            if (entities.attribute[0].value === 'housing_tenant') {
              this.set('attributes', { ...this.get('attributes'), housing: 'tenant' });
              return 'waiting_for_attribute_new_resident';
            } else if (entities.attribute[0].value === 'housing_owner') {
              this.set('attributes', { ...this.get('attributes'), housing: 'owner' });
              return 'waiting_for_attribute_new_resident';
            } else if (entities.attribute[0].value === 'housing_homeless') {
              this.set('attributes', { ...this.get('attributes'), housing: 'homeless' });
              return 'waiting_for_attribute_new_resident';
            }
          }
          return this.messagingClient.send(i18n('bot_apology', {
            appendQuestion: i18n('intro_survey_attribute_housing'),
          }), housingRequestQuickReplies);
        });
    },
  },

  waiting_for_attribute_new_resident: {
    enter() {
      this.messagingClient.send(i18n('intro_survey_attribute_new_resident', {
        organizationName: this.get('organization').name,
      }), replyTemplates.yesNoMix());
    },
    message() {
      return nlp.message(this.snapshot.input.payload.text)
        .then((nlpData) => {
          this.snapshot.nlp = nlpData;
          const entities = nlpData.entities;
          if (entities.intent && entities.intent[0]) {
            if (entities.intent[0].value === 'speech_confirm') {
              this.set('attributes', { ...this.get('attributes'), new_resident: true });
              return 'waiting_for_attribute_business_owner';
            } else if (entities.intent[0].value === 'speech_deny') {
              this.set('attributes', { ...this.get('attributes'), new_resident: false });
              return 'waiting_for_attribute_business_owner';
            }
          }
          this.messagingClient.send(i18n('bot_apology', { appendQuestion: i18n('intro_survey_attribute_new_resident', {
            organizationName: this.get('organization').name,
          }) }), replyTemplates.yesNoMix());
        });
    },
  },

  waiting_for_attribute_business_owner: {
    enter() {
      this.messagingClient.send(i18n('intro_survey_attribute_business_owner', {
        organizationName: this.get('organization').name,
      }), replyTemplates.yesNoMix());
    },
    message() {
      return nlp.message(this.snapshot.input.payload.text)
        .then((nlpData) => {
          this.snapshot.nlp = nlpData;
          const entities = nlpData.entities;
          if (entities.intent && entities.intent[0]) {
            if (entities.intent[0].value === 'speech_confirm') {
              this.set('attributes', { ...this.get('attributes'), business_owner: true });
              return 'waiting_for_attribute_dog_or_cats';
            } else if (entities.intent[0].value === 'speech_deny') {
              this.set('attributes', { ...this.get('attributes'), business_owner: false });
              return 'waiting_for_attribute_dog_or_cats';
            }
          }
          this.messagingClient.send(i18n('bot_apology', { appendQuestion: i18n('intro_survey_attribute_business_owner', {
            organizationName: this.get('organization').name,
          }) }), replyTemplates.yesNoMix());
        });
    },
  },

  waiting_for_attribute_dog_or_cats: {
    enter() {
      this.messagingClient.send(i18n('intro_survey_attribute_dogs_or_cats'), petQuickReplies);
    },
    message() {
      return nlp.message(this.snapshot.input.payload.text)
        .then((nlpData) => {
          this.snapshot.nlp = nlpData;
          const entities = nlpData.entities;
          if (entities.attribute && entities.attribute[0]) {
            if (entities.attribute[0].value === 'pet_cat') {
              this.set('attributes', { ...this.get('attributes'), pet: 'cat' });
            } else if (entities.attribute[0].value === 'pet_dog') {
              this.set('attributes', { ...this.get('attributes'), pet: 'dog' });
            }
          }
          return this.messagingClient.send(':D Great that was a big help!').then(() => 'what_can_i_do');
        });
    },
  },

  what_can_i_do: {
    enter() {
      const elements = [
        elementTemplates.genericVotingAndElections,
      ];
      // Add elements depending on constituent attributes
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
      // New Resident
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
          help: 'what_can_i_do',
          greeting: 'handle_greeting',
          thanks: 'handle_thank_you',
          praise: 'handle_praise',
          benefits_internet: 'benefits-internet.init',

          voting_deadlines: 'voting.votingDeadlines', // TODO(nicksahler): not trained
          voting_list_elections: 'voting.electionSchedule',
          voting_registration: 'voting.voterRegistrationGet',
          voting_registration_check: 'voting.voterRegistrationCheck',
          voting_poll_info: 'voting.pollInfo',
          voting_id: 'voting.voterIdRequirements',
          voting_eligibility: 'voting.stateVotingRules',
          voting_sample_ballot: 'voting.sampleBallot',
          voting_absentee: 'voting.absenteeVote',
          voting_early: 'voting.earlyVoting',
          voting_problem: 'voting.voterProblem',
          voting_assistance: 'voting.voterAssistance',

          social_services_shelters: 'socialServices.waiting_shelter_search',
          social_services_food_assistance: 'socialServices.waiting_food_search',
          social_services_hygiene: 'socialServices.waiting_hygiene_search',

          health_clinics: 'health.waiting_clinic_search',

          employment_job_training: 'employment.waiting_job_training',

          general_complaint: 'survey.loading_survey',
          cases_list: 'getCases',

          settings_city: 'setup.reset_organization',
        };

        if (entities.intent && entities.intent[0]) {
          return Promise.resolve(intentMap[entities.intent[0].value] ||
            fetchAnswers(entities.intent[0].value, this));
        }
        return 'failedRequest';
      });
    },

    action() {
      const goTo = {
        MAKE_REQUEST: 'survey.loading_survey', // Dont think this will work cause we dont have intent to pull off of
        GET_REQUESTS: 'getCases',
        GET_STARTED: 'init',
        CHANGE_CITY: 'setup.reset_organization',
        ASK_OPTIONS: 'what_can_i_do',
        FREQ_QUESTION_LIST: 'resident_question_list',
        FREQ_SERVICE_LIST: 'resident_service_list',
        FREQ_BUSINESS_QUESTIONS_LIST: 'business_questions_list',
        FREQ_BUSINESS_REQUIREMENTS_LIST: 'business_requirements_list',
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

  getCases() {
    return getConstituentCases(this.snapshot.constituent).then(({ cases }) => {
      if (cases.length > 0) {
        cases.forEach((thisCase) => {
          const message = `${thisCase.status.toUpperCase()} (#${thisCase.id})`;
          this.messagingClient.addToQuene(message);
        });
        return this.messagingClient.runQuene().then(() => 'start');
      }
      this.messagingClient.send('Looks like you haven\'t made any requests yet!', [
        { content_type: 'text', title: 'Leave a Request', payload: 'MAKE_REQUEST' },
      ]);
      return 'start';
    });
  },

  failedRequest() {
    new SlackService({
      username: 'Misunderstood Request',
      icon: 'question',
    }).send(`>*Request Message*: ${this.snapshot.input.payload.text}\n>*Constituent ID*: ${this.snapshot.constituent.id}`);
    // If first failure, ask for a repeat of question
    if (this.snapshot.state_machine_previous_state !== 'failedRequest') {
      return this.messagingClient.send('I\'m doing my best but I couldn\'t find an answer or might be misunderstanding. Can you try saying that another way?')
        .then(() => 'start');
    }
    // If second failure, fetch resources to assist
    const label = this.snapshot.nlp.entities.category[0].value || 'general';
    return getCategoryEntities(label, this.snapshot.organization_id).then((labelData) => {
      // See if we have fallback help for this category
      // If none found (and we werent already general), fetch general fallback contacts/departments
      if (labelData.contacts.length === 0 && label !== 'general') {
        return getCategoryEntities('general', this.snapshot.organization_id).then((generalData) => {
          // If we have fallbacks
          if (generalData.contacts.length === 0) {
            this.messagingClient.addToQuene('I don\'t have an answer to this, but I\'ve gathered potentially helpful employees for you. Give them a shot:');
            this.messagingClient.addToQuene({
              type: 'template',
              templateType: 'generic',
              elements: generalData.contacts.map(contact => elementTemplates.genericContact(contact)),
            });
            this.messagingClient.addToQuene('Or if you prefer you can also "Make a Request"!', replyTemplates.makeRequest);
          // If we don't have fallbacks
          } else {
            this.messagingClient.addToQuene('I\'m don\'t think I can help with this :(');
            this.messagingClient.addToQuene('I recommend you "Make a Request", so I can forward it to the local government for you! I can let you know when they respond with an answer.', replyTemplates.makeRequest);
          }
          return this.messagingClient.runQuene().then(() => 'start');
        });
      }
      // Run Category Specific Response
      this.messagingClient.addToQuene('I don\'t have an answer to this, but I\'ve gathered potentially helpful employees for you. Give them a shot:');
      this.messagingClient.addToQuene({
        type: 'template',
        templateType: 'generic',
        elements: labelData.contacts.map(contact => elementTemplates.genericContact(contact)),
      });
      this.messagingClient.addToQuene('If you prefer, you can also "Make a Request"!', replyTemplates.makeRequest);
      return this.messagingClient.runQuene().then(() => 'start');
    }).catch(() => 'start');
  },

  handle_greeting() {
    const greetings = [
      'Hey there! :) What can I help you with?',
      'Hey there! :) What can I help you with?',
      'Hey there! :) What can I help you with?',
      'Hey there! :) What can I help you with?',
      'Yo yooooo',
      'yo yo yo',
    ];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    this.messagingClient.send(greeting, basicRequestQuickReplies);
    return 'start';
  },

  handle_praise() {
    const thanks = [
      'Thanks!!! :D',
      '<3',
    ];
    const thank = thanks[Math.floor(Math.random() * thanks.length)];
    this.messagingClient.send(thank);
    return 'start';
  },

  handle_thank_you() {
    const youreWelcomes = [
      'Anytime :)',
      'You are very welcome! :)',
      'No problem! :)',
    ];
    const youreWelcome = youreWelcomes[Math.floor(Math.random() * youreWelcomes.length)];
    this.messagingClient.send(youreWelcome);
    return 'start';
  },
};
