import { logger } from '../../logger';
import * as TAGS from '../../constants/nlp-tagging';
import { nlp } from '../../services/nlp';
import { entityValueIs } from '../helpers';
import { getConstituentCases } from '../../cases/helpers';
import SlackService from '../../services/slack';

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
      const input = this.snapshot.input.payload;
      return nlp.message(input.text, {}).then((nlpData) => {
        this.set('nlp', nlpData.entities);
        const entities = nlpData.entities;
        if (entities[TAGS.REACTION]) {
          if (entityValueIs(entities[TAGS.REACTION], [TAGS.SKEPTICAL])) {
            return this.messagingClient.send('I get it. Governments can barely get a website working. How could they possibly have a chatbot!?! :P')
              .then(() => 'waiting_for_starting_interaction_options');
          } else if (entityValueIs(entities[TAGS.REACTION], [TAGS.ELABORATE])) {
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
        this.set('nlp', nlpData.entities);
        const entities = nlpData.entities;
        if (entities[TAGS.VOTING]) {
          if (entityValueIs(entities[TAGS.VOTING], [TAGS.REGISTER_TO_VOTE])) {
            return this.stateRedirect({
              whenExiting: 'voting.voterRegistrationGet',
              exitInstead: 'smallTalk.waiting_for_starting_interaction_end',
            }, 'voting.voterRegistrationGet');
          } else if (entityValueIs(entities[TAGS.VOTING], [TAGS.CHECK_VOTER_REGISTRATION])) {
            return this.stateRedirect({
              whenExiting: 'voting.voterRegistrationCheck',
              exitInstead: 'smallTalk.waiting_for_starting_interaction_end',
            }, 'voting.voterRegistrationCheck');
          }
        }
        if (entities[TAGS.CONFIRM_DENY]) {
          if (entityValueIs(entities[TAGS.CONFIRM_DENY], [TAGS.NO])) {
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
      const input = this.snapshot.input.payload;
      return nlp.message(input.text, {}).then((nlpData) => {
        this.set('nlp', nlpData.entities);
        const entities = nlpData.entities;
        if (entities[TAGS.REACTION]) {
          if (entityValueIs(entities[TAGS.REACTION], [TAGS.ACCEPTING])) {
            this.messagingClient.addToQuene({
              type: 'image',
              url: 'http://i.giphy.com/Mxygn6lbNmh20.gif',
            });
          }
          if (entityValueIs(entities[TAGS.REACTION], [TAGS.SKEPTICAL])) {
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
    if (this.get('organization').activated) {
      this.messagingClient.addToQuene('Your local government is great! They have told me quite a bit!', basicRequestQuickReplies);
    } else {
      this.messagingClient.addToQuene('Your local government still has a lot to tell me, but I will do my best to help!', basicRequestQuickReplies);
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

// TODO: Move to init
  start: {
    message() {
      logger.info('State: Start');
      const input = this.snapshot.input.payload;


      return nlp.message(input.text, {}).then((nlpData) => {
        this.set('nlp', nlpData.entities);
        const entities = nlpData.entities;
        logger.info(nlpData);

        // Help
        if (entityValueIs(entities[TAGS.HELP], [TAGS.ASK_OPTIONS])) {
          return 'askOptions';

        // Actual Small Talk
        } else if (entities[TAGS.SMALL_TALK]) {
          if (entityValueIs(entities[TAGS.SMALL_TALK], [TAGS.GREETING])) return 'handle_greeting';

        // Benefits
        } else if (entities[TAGS.BENEFITS]) {
          // return this.messagingClient.send('Benefit Kitchen can help you learn about state and federal programs. For now, visit their website: https://app.benefitkitchen.com/');
          if (entityValueIs(entities[TAGS.BENEFITS], [TAGS.HIGH_SPEED_INTERNET_CHECK])) {
            return 'benefits-internet.init';
          }
        // Voting
        } else if (entities[TAGS.VOTING]) {
          // Deadlines
          if (entityValueIs(entities[TAGS.VOTING], [TAGS.VOTING_DEADLINES])) return 'voting.votingDeadlines';
          // Elections
          if (entityValueIs(entities[TAGS.VOTING], [TAGS.LIST_ELECTIONS])) return 'voting.electionSchedule';
          // Registration
          if (entityValueIs(entities[TAGS.VOTING], [TAGS.REGISTER_TO_VOTE])) return 'voting.voterRegistrationGet';
          if (entityValueIs(entities[TAGS.VOTING], [TAGS.CHECK_VOTER_REGISTRATION])) return 'voting.voterRegistrationCheck';
          // Poll info
          if (entityValueIs(entities[TAGS.VOTING], [TAGS.POLL_INFO])) return 'voting.pollInfo';
          // Rules
          if (entityValueIs(entities[TAGS.VOTING], [TAGS.VOTER_ID])) return 'voting.voterIdRequirements';
          if (entityValueIs(entities[TAGS.VOTING], [TAGS.VOTER_ELIGIBILITY])) return 'voting.stateVotingRules';
          // Sample ballot
          if (entityValueIs(entities[TAGS.VOTING], [TAGS.SAMPLE_BALLOT])) return 'voting.sampleBallot';
          // Absentee ballot
          if (entityValueIs(entities[TAGS.VOTING], [TAGS.ABSENTEE_VOTE])) return 'voting.absenteeVote';
          // Early Voting
          if (entityValueIs(entities[TAGS.VOTING], [TAGS.EARLY_VOTING])) return 'voting.earlyVoting';
          // Problem
          if (entityValueIs(entities[TAGS.VOTING], [TAGS.VOTER_PROBLEM])) return 'voting.voterProblem';
          // FAQ/Help
          if (entityValueIs(entities[TAGS.VOTING], [TAGS.VOTER_ASSISTANCE])) return 'voting.voterAssistance';
          // Fallback
          return 'failedRequest';

        // Sanitation Services
        } else if (entities[TAGS.SANITATION]) {
          // Garbage
          if (entityValueIs(entities[TAGS.SANITATION], [TAGS.GARBAGE_SCHEDULE])) return 'sanitation.garbageSchedule';
          if (entityValueIs(entities[TAGS.SANITATION], [TAGS.GARBAGE_DROP_OFF])) return 'sanitation.garbageDropOff';
          // Recycling
          if (entityValueIs(entities[TAGS.SANITATION], [TAGS.RECYCLING_SCHEDULE])) return 'sanitation.recyclingSchedule';
          if (entityValueIs(entities[TAGS.SANITATION], [TAGS.RECYCLING_DROP_OFF])) return 'sanitation.recyclingDropOff';
          // Compost
          if (entityValueIs(entities[TAGS.SANITATION], [TAGS.COMPOST_DUMPING])) return 'sanitation.compostDumping';
          // Bulk Pickup
          if (entityValueIs(entities[TAGS.SANITATION], [TAGS.BULK_PICKUP])) return 'sanitation.bulkPickup';
          // Electronics
          if (entityValueIs(entities[TAGS.SANITATION], [TAGS.ELECTRONICS_DISPOSAL])) return 'sanitation.electronicsDisposal';
          // Fallback
          return 'failedRequest';

        // Human Services
        } else if (entities[TAGS.SOCIAL_SERVICES]) {
          // Shelters
          if (entityValueIs(entities[TAGS.SOCIAL_SERVICES], [TAGS.SHELTER_SEARCH])) return 'socialServices.waiting_shelter_search';
          // Food
          if (entityValueIs(entities[TAGS.SOCIAL_SERVICES], [TAGS.FOOD_SEARCH])) return 'socialServices.waiting_food_search';
          // Hygiene
          if (entityValueIs(entities[TAGS.SOCIAL_SERVICES], [TAGS.HYGIENE_SEARCH])) return 'socialServices.waiting_hygiene_search';
          // Fallback
          return 'failedRequest';

        // Medical Services
        } else if (entities[TAGS.HEALTH]) {
          // Clinics
          if (entityValueIs(entities[TAGS.HEALTH], [TAGS.CLINIC_SEARCH])) return 'health.waiting_clinic_search';
          // Fallback
          return 'failedRequest';

        // Employment Services
        } else if (entities[TAGS.EMPLOYMENT]) {
          // Job Training
          if (entityValueIs(entities[TAGS.EMPLOYMENT], [TAGS.JOB_TRAINING])) return 'employment.waiting_job_training';
          // Fallback
          return 'failedRequest';

        // Complaint
        } else if (entities[TAGS.COMPLAINT]) {
          if (entities[TAGS.TRANSACTION]) {
            return 'getRequests';
          } else {
            return 'complaint.waiting_for_complaint';
          }

        // Settings
        } else if (entities[TAGS.SETTINGS]) {
          // Change City
          if (entityValueIs(entities[TAGS.SETTINGS], [TAGS.CHANGE_CITY])) return 'setup.reset_organization';
          // Fallback
          return 'failedRequest';

        // Failed to Understand Request
        } else {
          return 'failedRequest';
        }
      });
    },

    action() {
      return {
        'MAKE_REQUEST': 'complaint.init',
        'GET_REQUESTS': 'getRequests',
        'GET_STARTED': 'init',
        'CHANGE_CITY': 'setup.reset_organization',
        'ASK_OPTIONS': 'askOptions',
      }[this.snapshot.input.payload.payload];
    }
  },

  getRequests() {
    return getConstituentCases(this.snapshot.constituent).then(({ cases }) => {
      cases.forEach((thisCase) => {
        const message = `${thisCase.status.toUpperCase()} - ${thisCase.title.length > 48 ? thisCase.title.slice(0, 45).concat('...') : thisCase.title} (#${thisCase.id})`;
        this.messagingClient.addToQuene(message);
      });
      return this.messagingClient.runQuene().then(() => 'start');
    });
  },

  failedRequest(aux = {}) {
    new SlackService({
      username: 'Misunderstood Request',
      icon: 'question',
    }).send(`>*Request Message*: ${aux.input.payload.text}\n>*Constituent ID*: ${this.snapshot.constituent.id}`);
    const message = 'Ah shoot, I\'m still learning so I don\'t understand that request yet. Can you give more description? <3';
    this.messagingClient.send(message);
    return 'start';
  },
};
