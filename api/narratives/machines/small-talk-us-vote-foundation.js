import { logger } from '../../logger';
import { nlp } from '../../services/nlp';
import SlackService from '../../services/slack';
import * as elementTemplates from '../templates/elements';

const baseQuickReplies = [
  { content_type: 'text', title: '📅 Upcoming Elections', payload: 'Upcoming Elections' },
  { content_type: 'text', title: '📨 Register to Vote', payload: 'Register to Vote' },
  { content_type: 'text', title: 'What can I ask?', payload: 'What Can I Ask?' },
];

const i18n = (key, inserts = {}) => {
  const translations = {
    intro_hello: `Hey there! ${inserts.name ? ` I'm ${inserts.name}!` : ''} 🇺🇸`,
  };
  return translations[key];
};

export default {
  init: {
    enter() {
      const name = this.snapshot.constituent.facebookEntry.intro_name ||
        this.snapshot.constituent.facebookEntry.name;
      this.messagingClient.addAll([
        i18n('intro_hello', { name }),
      ]);
      return this.messagingClient.runQuene().then(() => {
        if (!this.get('location')) return this.stateRedirect('location', this.getBaseState('what_can_i_do'));
        return 'what_can_i_do';
      });
    },
  },
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
          'speech.greeting': 'handle_greeting',
          'speech.thanks': 'handle_thank_you',
          'speech.praise': 'handle_praise',

          'voting.deadlines': 'voting.votingDeadlines',
          'voting.elections': 'voting.electionSchedule',
          'voting.registration.get': 'voting.voterRegistrationGet',
          'voting.registration.check': 'voting.voterRegistrationCheck',
          'voting.poll_info': 'voting.pollInfo',
          'voting.id': 'voting.voterIdRequirements',
          'voting.eligibility': 'voting.stateVotingRules',
          'voting.sample_ballot': 'voting.sampleBallot',
          'voting.absentee_ballot': 'voting.absenteeVote',
          'voting.early': 'voting.earlyVoting',
          'voting.problem': 'voting.voterProblem',
          'voting.assistance': 'voting.voterAssistance',

          'settings.locality.change': 'setup.reset_organization',
        };

        if (entities.intent && entities.intent[0]) {
          return Promise.resolve(intentMap[entities.intent[0].value]);
        }
        return 'failedRequest';
      });
    },
    action() {
      const goTo = {
        GET_STARTED: 'init',
        CHANGE_CITY: 'setup.reset_organization',
        WHAT_CAN_I_DO: 'what_can_i_do',
      }[this.snapshot.input.payload.payload];
      if (!goTo) return this.input('message');
      return goTo;
    },
  },
  what_can_i_do() {
    const elements = [
      {
        title: 'U.S. Vote Foundation',
        subtitle: 'Ask about elections, voter ID laws, registration deadlines, and anything else to help you elect representatives!',
        image_url: 'https://s3.amazonaws.com/kit.community/public/images/logos/USVF_logo_H.jpg',
        buttons: [{
          type: 'web_url',
          title: 'Website',
          url: 'https://usvotefoundation.org',
        }, {
          type: 'web_url',
          title: 'Our Mission',
          url: 'https://www.usvotefoundation.org/vision-and-mission',
        }, {
          type: 'web_url',
          title: 'Create Account',
          url: 'https://www.usvotefoundation.org/vote/CreateAccount.htm',
        }],
      },
      elementTemplates.genericVotingAndElections,
    ];
    this.messagingClient.addToQuene({
      type: 'template',
      templateType: 'generic',
      elements,
    });
    this.messagingClient.addToQuene('I can help you navigate voting ID requirements, registration deadlines, and give you info about upcoming elections! Just ask away!', baseQuickReplies);
    return this.messagingClient.runQuene().then(() => 'start');
  },
  handle_greeting() {
    this.messagingClient.send('Hey there! How can I help you with elections or voting?', baseQuickReplies);
    return 'start';
  },
  handle_praise() {
    this.messagingClient.send('Thanks!! :)', baseQuickReplies);
    return 'start';
  },
  handle_thank_you() {
    this.messagingClient.send('No problem!', baseQuickReplies);
    return 'start';
  },
  failedRequest() {
    new SlackService({
      username: 'Misunderstood Request - US Vote Foundation',
      icon: 'question',
    }).send(`>*Request Message*: ${this.snapshot.input.payload.text}\n>*Constituent ID*: ${this.snapshot.constituent.id}`);
    // If first failure, ask for a repeat of question
    if (this.snapshot.state_machine_previous_state !== 'failedRequest') {
      return this.messagingClient.send('I think I\'m misunderstanding. Can you say that another way?')
        .then(() => 'start');
    }
    return this.messagingClient.send('Unforunately, I think your request is beyond my abilities!')
      .then(() => 'voting.voterAssistance');
  },
};

export const persistentMenu = [{
  locale: 'default',
  call_to_actions: [{
    type: 'postback',
    title: '📅 Upcoming Elections',
    payload: '📅 Upcoming Elections',
  }, {
    type: 'postback',
    title: '📨 Register to Vote',
    payload: '📨 Register to Vote',
  }, {
    type: 'postback',
    title: '❓ What can I ask?',
    payload: 'WHAT_CAN_I_DO',
  }],
}];
