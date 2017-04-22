import { logger } from '../../logger';
import * as TAGS from '../../constants/nlp-tagging';
import { nlp } from '../../services/nlp';
import * as CASE_CONSTANTS from '../../constants/cases';
import * as ORGANIZATION_CONSTANTS from '../../constants/organizations';
import { getConstituentCases, handleConstituentRequest } from '../../cases/helpers';
import SlackService from '../../services/slack';
import { fetchAnswers } from '../helpers';

/* TODO(nicksahler) until I build the full i18n class */
const i18n = function(key, inserts = {}) {
  var translations = {
    'intro_hello': `Hey there! Thanks for sending me a message :D I'm ${inserts.name ? `${inserts.name}, ` : ''}an artifically intelligent assistant for your local government! Pretty cool huh?`,
    'intro_information': `I can help you leave complaints, request services, and so much more!`,
    'organization_confirmation': `You're interested in engaging ${inserts.organizationName}, right?`,
    'bot_apology': `Sorry, I wasn't expeting that answer or may have misunderstood. ${inserts.appendQuestion ? inserts.appendQuestion : ''}`,
  };
  return translations[key];
};

const startingQuickReplies = [
  { content_type: 'text', title: 'Yes!', payload: 'Yes!' },
  { content_type: 'text', title: 'No', payload: 'No' },
];

const basicRequestQuickReplies = [
  { content_type: 'text', title: 'Upcoming Elections', payload: 'Upcoming Elections' },
  { content_type: 'text', title: 'Available Benefits', payload: 'Available Benefits' },
  { content_type: 'text', title: 'Raise an Issue', payload: 'MAKE_REQUEST' },
];

export default {
  init: {
    enter() {
      let name;
      let pictureUrl = 'https://scontent-lga3-1.xx.fbcdn.net/v/t31.0-8/16422989_187757401706018_5896478987148979475_o.png?oh=e1edeead1710b85f3d42e669685f3d59&oe=590603C2';
      if (this.snapshot.constituent.facebookEntry) {
        name = this.snapshot.constituent.facebookEntry.intro_name;
        if (this.snapshot.constituent.facebookEntry.intro_picture_url) {
          pictureUrl = this.snapshot.constituent.facebookEntry.intro_picture_url;
        }
      } else if (this.snapshot.constituent.smsEntry) {
        name = this.snapshot.constituent.smsEntry.intro_name;
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
        return 'waiting_for_organization_confirmation';
      });
    },
  },

  human_override: {
    enter() {
      new SlackService({
        username: 'Entered Human Override',
        icon: 'monkey_face',
      }).send(`Respond here to say hey, respond with :robot_face: to return control to the robot.`);
    },

    message() {
     // Not done yet lol
      return 'start';
    }
  },

  waiting_for_organization_confirmation: {
    enter() {
      this.messagingClient.send(i18n('organization_confirmation', {
        organizationName: this.snapshot.data_store.organization.name,
      }), startingQuickReplies);
    },
    message() {
      return nlp.message(this.snapshot.input.payload.text, {}).then((nlpData) => {
        this.snapshot.nlp = nlpData;
        const entities = nlpData.entities;
        if (entities.intent && entities.intent[0]) {
          if (entities.intent[0].value === 'speech_confirm') {
            return this.messagingClient.send('Great! I’m going to do my best to help with your local concerns, but remember I’m not an encylopedia :P')
              .then(() => 'what_can_i_do');
          }
          if (entities.intent[0].value === 'speech_deny') {
            return this.stateRedirect('location', 'smallTalk.what_can_i_do');
          }
        }
        this.messagingClient.send(i18n('bot_apology', { appendQuestion: i18n('organization_confirmation', {
          organizationName: this.snapshot.data_store.organization.name,
        }) }), startingQuickReplies);
      });
    },
  },

  what_can_i_do: {
    enter() {
      this.messagingClient.addToQuene('Here are some ways I can help you interact with government!');
      this.messagingClient.addToQuene({
        type: 'template',
        templateType: 'generic',
        elements: [{
          title: 'Voting',
          subtitle: 'Do its',
          buttons: [{
            type: 'postback',
            title: 'Start Chatting',
            payload: 'Start Chatting',
          }],
        }],
      });
      return this.messagingClient.runQuene().then(() => 'start');
    },
  },

  handle_greeting() {
    this.messagingClient.send('Hey there! I\'m not much for small talk at the moment :/ Focusing on learning ways to help you interact with city governments right now!', basicRequestQuickReplies);
    return 'start';
  },

  // TODO(nicksahler): Move to init
  start: {
    message() {
      const input = this.snapshot.input.payload;
      return nlp.message(input.text, {}).then((nlpData) => {
        this.snapshot.nlp = nlpData;

        logger.info(nlpData);

        const entities = nlpData.entities;
        const intent_map = {
          'help': 'what_can_i_do',
          'greeting': 'handle_greeting',
          'benefits_internet': 'benefits-internet.init',

          'voting_deadlines': 'voting.votingDeadlines', // TODO(nicksahler): not trained
          'voting_list_elections': 'voting.electionSchedule',
          'voting_registration': 'voting.voterRegistrationGet',
          'voting_registration_check': 'voting.voterRegistrationCheck',
          'voting_poll_info': 'voting.pollInfo',
          'voting_id': 'voting.voterIdRequirements',
          'voting_eligibility': 'voting.stateVotingRules',
          'voting_sample_ballot': 'voting.sampleBallot',
          'voting_absentee': 'voting.absenteeVote',
          'voting_early': 'voting.earlyVoting',
          'voting_problem': 'voting.voterProblem',
          'voting_assistance': 'voting.voterAssistance',

          'social_services_shelters': 'socialServices.waiting_shelter_search',
          'social_services_food_assistance': 'socialServices.waiting_food_search',
          'social_services_hygiene': 'socialServices.waiting_hygiene_search',

          'health_clinics': 'health.waiting_clinic_search',

          'employment_job_training': 'employment.waiting_job_training',

          'complaint': 'complaint.waiting_for_complaint', // TODO(nicksahler): transaction -> getRequests,

          'settings_city': 'setup.reset_organization'

        };

        if (entities.intent && entities.intent[0]) {
          return Promise.resolve(intent_map[entities.intent[0].value] || fetchAnswers(entities.intent[0].value, this));
        } else {
          return 'failedRequest';
        }
      })
    },

    action() {
      return {
        'MAKE_REQUEST': 'complaint.waiting_for_complaint',
        'GET_REQUESTS': 'getRequests',
        'GET_STARTED': 'init',
        'CHANGE_CITY': 'setup.reset_organization',
        'ASK_OPTIONS': 'what_can_i_do',
      }[this.snapshot.input.payload.payload];
    }
  },

  getRequests() {
    return getConstituentCases(this.snapshot.constituent).then(({ cases }) => {
      if (cases.length > 0) {
        cases.forEach((thisCase) => {
          const message = `${thisCase.status.toUpperCase()} - ${thisCase.title.length > 48 ? thisCase.title.slice(0, 45).concat('...') : thisCase.title} (#${thisCase.id})`;
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

  failedRequest(aux = {}) {
    new SlackService({
      username: 'Misunderstood Request',
      icon: 'question',
    }).send(`>*Request Message*: ${aux.input.payload.text}\n>*Constituent ID*: ${this.snapshot.constituent.id}`);
    const message = 'Ah shoot, I\'m still learning so I don\'t understand that request yet. Can you give more description? <3';
    handleConstituentRequest({
      title: aux.input.payload.text,
      type: CASE_CONSTANTS.STATEMENT,
    },
      this.snapshot.constituent,
      this.get('organization') || { id: this.snapshot.organization_id,
    });
    this.messagingClient.send(message);
    return 'start';
  },
};
