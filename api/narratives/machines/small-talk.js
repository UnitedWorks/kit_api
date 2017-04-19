import { logger } from '../../logger';
import * as TAGS from '../../constants/nlp-tagging';
import { nlp } from '../../services/nlp';
import * as CASE_TYPES from '../../constants/case-types';
import { getConstituentCases, handleConstituentRequest } from '../../cases/helpers';
import SlackService from '../../services/slack';
import { fetchAnswers } from '../helpers';

/* TODO(nicksahler) until I build the full i18n class */
const i18n = function(key) {
  var translations = {
    'intro_hello': 'Hey there! :) I’m the Mayor, a chatbot to help you make sense of government large and small!',
    'intro_information': 'I can help you register to vote, navigate state/federal benefits, alert you of school closings, and more! How great is that?',
    'intro_excitement': ':D Thought you\'d never ask!',
    'intro_explanation': 'Local governments and service providers tell me answers for frequently asked questions. When you ask, I sift through all it to give you the best answer! I want to save you from struggling with websites and phone calls.',
    'intro_ask_location': 'So I can give you the right answers, what CITY and STATE are you in?',
    'bot_apology': 'Sorry, I may not be understanding :( Can you try saying that with more detail?',
  };
  return translations[key];
};

const startingQuickReplies = [
  { content_type: 'text', title: 'Tell me more!', payload: 'Tell me more!' },
  { content_type: 'text', title: 'Hmm...', payload: 'Hmm...' },
];

const skpeticQuickReplies = [
  { content_type: 'text', title: 'Get registered!', payload: 'Get registered to vote' },
  { content_type: 'text', title: 'Am I registered?', payload: 'Am I registered to vote?' },
  { content_type: 'text', title: 'No thanks', payload: 'No thanks' },
];

const basicRequestQuickReplies = [
  { content_type: 'text', title: 'Upcoming Elections', payload: 'Upcoming Elections' },
  { content_type: 'text', title: 'Available Benefits', payload: 'Available Benefits' },
  { content_type: 'text', title: 'Raise an Issue', payload: 'MAKE_REQUEST' },
];

export default {
  init: {
    enter() {
      this.messagingClient.addAll([
        i18n('intro_hello'),
        {
          type: 'image',
          url: 'https://scontent-lga3-1.xx.fbcdn.net/v/t31.0-8/16422989_187757401706018_5896478987148979475_o.png?oh=e1edeead1710b85f3d42e669685f3d59&oe=590603C2',
        },
      ]);
      return this.messagingClient.runQuene().then(() => {
        return 'waiting_for_starting_interaction';
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

  waiting_for_starting_interaction: {
    enter() {
      this.messagingClient.send(i18n('intro_information'), startingQuickReplies);
    },
    message() {
      return nlp.message(this.snapshot.input.payload.text, {}).then((nlpData) => {
        this.snapshot.nlp = nlpData;
        const entities = nlpData.entities;

        if (entities.intent && entities.intent[0]) {
          if (entities.intent[0].value === 'speech_skeptical') {
            return this.messagingClient.send('I get it. Governments can barely get a website working. How could they possibly have a chatbot!?! :P')
              .then(() => 'waiting_for_starting_interaction_options');
          }

          if (entities.intent[0].value === 'speech_elaborate') {
            this.messagingClient.addAll([
              {
                type: 'image',
                url: 'https://scontent-lga3-1.xx.fbcdn.net/v/t31.0-8/16463485_187743068374118_731666577286732253_o.png?oh=145d7d19e62113f3d2a56a74f1632d13&oe=590ABC31',
              },
              i18n('intro_explanation'),
            ]);

            return this.messagingClient.runQuene().then(() => 'waiting_for_starting_interaction_options');
          }
        }

        this.messagingClient.send(i18n('bot_apology'), startingQuickReplies);
      });
    },
  },

  waiting_for_starting_interaction_options: {
    enter() {
      this.messagingClient.send('How about I tell you how to register to vote?', skpeticQuickReplies);
    },
    message() {
      const input = this.snapshot.input.payload;
      return nlp.message(input.text, {}).then((nlpData) => {
        this.snapshot.nlp = nlpData;
        const entities = nlpData.entities;

        if (entities.intent && entities.intent[0]) {
          if ( entities.intent[0].value === 'voting_registration') {
            return this.stateRedirect({
              whenExiting: 'voting.voterRegistrationGet',
              exitInstead: 'smallTalk.waiting_for_starting_interaction_end',
            }, 'voting.voterRegistrationGet');

            return 'voting.voterRegistrationGet';
          } else if ( entities.intent[0].value === 'voting_registration_check' ) {
            return this.stateRedirect({
              whenExiting: 'voting.voterRegistrationCheck',
              exitInstead: 'smallTalk.waiting_for_starting_interaction_end',
            }, 'voting.voterRegistrationCheck');

            return 'voting.voterRegistrationCheck';
          } else if ( entities.intent[0].value === 'speech_deny') {
            this.messagingClient.addAll([
              'Ok! In that case, let me give you a run down of what I can do!',
              i18n('intro_explanation'),
              i18n('intro_ask_location'),
            ]);

            return this.messagingClient.runQuene().then(() => 'setup.waiting_organization');
          }
        }

        this.messagingClient.send(i18n('bot_apology')).then(() => 'waiting_for_starting_interaction_options');
      });
    },
  },

  waiting_for_starting_interaction_end: {
    enter() {
      const quickReplies = [
        { content_type: 'text', title: 'WOH!', payload: 'Awesome!' },
        { content_type: 'text', title: 'Unimpressive', payload: 'Unimpressed' },
      ];
      this.messagingClient.send('How awesome was that?! :D', quickReplies);
    },
    message() {
      const quickReplies = [
        ...basicRequestQuickReplies,
        { content_type: 'text', title: 'What else can I ask?', payload: 'What can I ask?' },
      ];

      return nlp.message(this.snapshot.input.payload, {}).then((nlpData) => {
        this.snapshot.nlp = nlpData;
        const entities = nlpData.entities;

        if (entities.intent && entities.intent[0]) {
          if (entities.intent[0].value === 'speech_accepting') {
            this.messagingClient.addToQuene({
              type: 'image',
              url: 'http://i.giphy.com/Mxygn6lbNmh20.gif',
            });
          }

          if (entities.intent[0].value === 'speech_skeptical') {
            this.messagingClient.addToQuene({
              type: 'image',
              url: 'http://i.giphy.com/l3q2PnJK8NqG9KM5G.gif',
            });
            this.messagingClient.addToQuene('Tough crowd, huh. :|');
          }
        }

        this.messagingClient.addToQuene('In bot years, I\'m still young, but there are a few things I can help you and your local government with! Ask away.', quickReplies);

        return this.messagingClient.runQuene().then(() => 'start');
      });
    },
  },

  askOptions() {
    if (this.get('organization') && this.get('organization').activated) {
      this.messagingClient.addToQuene('Your local government is great! They have told me quite a bit!', basicRequestQuickReplies);
    } else {
      this.messagingClient.addToQuene('I\'m still learning from your local government, but I can help still with questions about voting and elections!', basicRequestQuickReplies);
    }
    this.messagingClient.addToQuene('Some starting questions you can ask are: "When is my next election?", "What benefits are available to me?", and "I have a complaint"', basicRequestQuickReplies);
    return this.messagingClient.runQuene().then(() => {
      return 'start';
    });
  },

  handle_greeting() {
    this.messagingClient.send('Hey there! I\'m not much for small talk at the moment :/ Focusing on learning ways to help you interact with city governments right now!', basicRequestQuickReplies)
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
          'help': 'askOptions',
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
        'ASK_OPTIONS': 'askOptions',
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
      type: CASE_TYPES.STATEMENT,
    },
      this.snapshot.constituent,
      this.get('organization') || { id: this.snapshot.organization_id,
    });
    this.messagingClient.send(message);
    return 'start';
  },
};
