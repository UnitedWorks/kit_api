import { logger } from '../../logger';
import * as TAGS from '../../constants/nlp-tagging';
import { nlp } from '../../services/nlp';
import * as CASE_CONSTANTS from '../../constants/cases';
import { getConstituentCases, createConstituentCase, addCaseNote } from '../../cases/helpers';
import SlackService from '../../services/slack';
import { fetchAnswers } from '../helpers';

/* TODO(nicksahler) until I build the full i18n class */
const i18n = function(key, inserts = {}) {
  var translations = {
    'intro_hello': `Hey there! :D I'm ${inserts.name ? `${inserts.name}, ` : ''}an artifically intelligent assistant connecting you to local gov!`,
    'intro_information': `I can let you leave complaints, request services, and more!`,
    'organization_confirmation': `You're interested in ${inserts.organizationName}, right?`,
    'bot_apology': `Sorry, I wasn't expeting that answer or may have misunderstood. ${inserts.appendQuestion ? inserts.appendQuestion : ''}`,
  };
  return translations[key];
};

const startingQuickReplies = [
  { content_type: 'text', title: 'Yes!', payload: 'Yes!' },
  { content_type: 'text', title: 'No', payload: 'No' },
];

const basicRequestQuickReplies = [
  { content_type: 'text', title: 'What can I ask?', payload: 'What can I ask?' },
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
        name = this.snapshot.constituent.facebookEntry.intro_name || this.snapshot.constituent.facebookEntry.name;
        if (this.snapshot.constituent.facebookEntry.intro_picture_url) {
          pictureUrl = this.snapshot.constituent.facebookEntry.intro_picture_url;
        }
      } else if (this.snapshot.constituent.smsEntry) {
        name = this.snapshot.constituent.smsEntry.intro_name || this.snapshot.constituent.smsEntry.name;
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

  expect_response: {
    message() {
      const expectedResponse = this.get('expected_response');
      // If there is a case_id, we need to add a note.
      if (expectedResponse.case_id) {
        // For now, just going to concat question and answer
        return addCaseNote(expectedResponse.case_id, `Q: ${expectedResponse.question} -- A: ${this.snapshot.input.payload.text}  `)
          .then(() => {
            this.messagingClient.send('I\'ve passed your message along!');
            return 'start';
          });
      }
      // If not, we're creating a new case!
      return createConstituentCase({
        title: `Following up: "${expectedResponse.question}"`,
        type: CASE_CONSTANTS.REQUEST,
        description: this.snapshot.input.payload.text,
        category: expectedResponse.category,
      },
      this.snapshot.constituent,
      this.get('organization') || { id: this.snapshot.organization_id,
      }).then(() => {
        this.set('expected_response', null);
        this.messagingClient.send('I\'ve pass your message along and will keep you updated!');
        return 'start';
      });
    },
  },

  waiting_for_organization_confirmation: {
    enter() {
      this.messagingClient.send(i18n('organization_confirmation', {
        organizationName: this.get('organization').name,
      }), startingQuickReplies);
    },
    message() {
      return nlp.message(this.snapshot.input.payload.text, {}).then((nlpData) => {
        this.snapshot.nlp = nlpData;
        const entities = nlpData.entities;
        if (entities.intent && entities.intent[0]) {
          if (entities.intent[0].value === 'speech_confirm') {
            return this.messagingClient.send('Great! :)').then(() => 'what_can_i_do');
          }
          if (entities.intent[0].value === 'speech_deny') {
            return this.stateRedirect('location', 'smallTalk.what_can_i_do');
          }
        }
        this.messagingClient.send(i18n('bot_apology', { appendQuestion: i18n('organization_confirmation', {
          organizationName: this.get('organization').name,
        }) }), startingQuickReplies);
      });
    },
  },

  what_can_i_do: {
    enter() {
      this.messagingClient.addToQuene('Here are some ways you can interact with your local government!');
      this.messagingClient.addToQuene({
        type: 'template',
        templateType: 'generic',
        elements: [{
          title: 'The basics!',
          subtitle: 'Schedule information and reminders about garbage and recycling!',
          image_url: 'https://scontent-lga3-1.xx.fbcdn.net/v/t31.0-8/18121443_233251170489974_389513167860373774_o.png?oh=5fdb797d78ed294fab4caeeca524e8dc&oe=598B0541',
          buttons: [{
            type: 'postback',
            title: 'Garbage pickup tomorrow?',
            payload: 'Garbage Pickup Tomorrow?',
          }, {
            type: 'postback',
            title: 'Garbage pickup next week?',
            payload: 'Garbage Pickup Next Week?',
          }, {
            type: 'postback',
            title: 'Bulk Pickup Request',
            payload: 'Bulk Pickup Request',
          }],
        }, {
          title: 'Local Gov Services',
          subtitle: 'Common questions about constituent and business needs',
          image_url: 'https://scontent-lga3-1.xx.fbcdn.net/v/t31.0-8/16463485_187743068374118_731666577286732253_o.png?oh=34db605884afb6fa415694f76f7b8214&oe=59816331',
          buttons: [{
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
          title: 'Reporting Issues and Concerns',
          subtitle: 'Record a problem you are facing, and a repersentative will get back to you with a response or resolution',
          image_url: 'https://scontent-lga3-1.xx.fbcdn.net/v/t31.0-8/18077241_232809757200782_8664249297555360938_o.png?oh=ff0af5e7afe55f651fd7d367dfa11574&oe=598B1E56',
          buttons: [{
            type: 'postback',
            title: 'Request a Service',
            payload: 'Request A Service',
          }, {
            type: 'postback',
            title: 'Make a Complaint',
            payload: 'MAKE_REQUEST',
          }, {
            type: 'postback',
            title: 'See My Requests',
            payload: 'GET_REQUESTS',
          }],
        }, {
          title: 'Voting and Elections',
          subtitle: 'Ask about elections, voter ID laws, registration deadlines, and anything else to help you elect representatives!',
          image_url: 'https://scontent-lga3-1.xx.fbcdn.net/v/t31.0-8/16586922_193481711133587_230696876501689696_o.png?oh=00e2b4adcd61378777e5ce3801a44650&oe=59985D7E',
          buttons: [{
            type: 'postback',
            title: 'Upcoming Elections',
            payload: 'Upcoming Elections',
          }, {
            type: 'postback',
            title: 'Register To Vote',
            payload: 'Register To Vote',
          }, {
            type: 'postback',
            title: 'Problem At Polls',
            payload: 'Problem At Polls',
          }],
        }, {
          title: 'Service Providers and Benefits',
          subtitle: 'Find out what state and federal benefits programs may be available for you and your family.',
          image_url: 'https://scontent-lga3-1.xx.fbcdn.net/v/t31.0-8/18056257_232842120530879_6922898701508692950_o.png?oh=1c387a889c56b387e8ca55b5c4b756af&oe=5994A489',
          buttons: [{
            type: 'postback',
            title: 'Report Unfair Wages',
            payload: 'Report Unfair Wages',
          }, {
            type: 'postback',
            title: 'Benefits Screener',
            payload: 'Benefits Screener',
          }, {
            type: 'postback',
            title: 'Find Job Training',
            payload: 'Find Job Training',
          }],
        }, {
          title: 'Immediate Help',
          subtitle: 'Find immediate or short-term assistance if you are facing tough times.',
          image_url: 'https://scontent-lga3-1.xx.fbcdn.net/v/t31.0-8/18076480_232825243865900_3433821028911633831_o.png?oh=fcc2d52c34dfb837272ccda9b928de22&oe=59766CF9',
          buttons: [{
            type: 'postback',
            title: 'Find Nearby Shelter',
            payload: 'Find Nearby Shelter',
          }, {
            type: 'postback',
            title: 'Find Nearby Clinic',
            payload: 'Find Nearby Clinic',
          }, {
            type: 'postback',
            title: 'Find Nearby Washroom',
            payload: 'Find Nearby Washroom',
          }],
        }, {
          title: 'About',
          subtitle: 'Learn more about this bot and what it does!',
          image_url: 'https://scontent-lga3-1.xx.fbcdn.net/v/t31.0-8/18056595_232810460534045_3606142951231659741_o.png?oh=9c2656704b2d8a0793f54a16e89234e1&oe=598D0793',
          buttons: [{
            type: 'postback',
            title: 'Leave Feedback',
            payload: 'Leave Feedback',
          }, {
            type: 'postback',
            title: 'How Does This Work?',
            payload: 'How Does This Work?',
          }, {
            type: 'postback',
            title: 'Change Language',
            payload: 'Change Language',
          }],
        }],
      });
      this.messagingClient.addToQuene('If you don\'t see it here, ask anyways! I might have an answer for you, and if not, I\'ll get back to you with it when I can.');
      return this.messagingClient.runQuene().then(() => 'start');
    },
  },

  handle_greeting() {
    this.messagingClient.send('Hey there! I\'m not much for small talk at the moment :/ I still have lots to focus on learning!', basicRequestQuickReplies);
    return 'start';
  },

  // TODO(nicksahler): Move to init
  start: {
    message() {
      if (!this.snapshot.input.payload.text && this.snapshot.input.payload.payload) {
        this.snapshot.input.payload.text = this.snapshot.input.payload.payload.replace(/([A-Z])/g, ' $1').trim();
      }
      return nlp.message(this.snapshot.input.payload.text, {}).then((nlpData) => {
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

          'general_complaint': () => this.fire('survey', 'loading_survey', { label: 'general_complaint' }), // TODO(nicksahler): transaction -> getCases,
          'cases_list': 'getCases',

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
      const goTo = {
        'MAKE_REQUEST': () => this.fire('survey', 'loading_survey', { label: 'general_complaint' }),
        'GET_REQUESTS': 'getCases',
        'GET_STARTED': 'init',
        'CHANGE_CITY': 'setup.reset_organization',
        'ASK_OPTIONS': 'what_can_i_do',
      }[this.snapshot.input.payload.payload];
      if (!goTo) return this.input('message');
      return goTo;
    },
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
    const message = 'Ah shoot, I\'m still learning so I don\'t understand that request yet. Can you give more description? <3';
    createConstituentCase({
      title: this.snapshot.input.payload.text,
      type: CASE_CONSTANTS.STATEMENT,
    },
      this.snapshot.constituent,
      this.get('organization') || { id: this.snapshot.organization_id,
    });
    this.messagingClient.send(message);
    return 'start';
  },
};
