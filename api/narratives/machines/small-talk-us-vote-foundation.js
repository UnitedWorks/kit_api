import { logger } from '../../logger';
import { nlp } from '../../services/nlp';
import SlackService from '../../services/slack';
import * as elementTemplates from '../templates/elements';

const baseQuickReplies = [
  { content_type: 'text', title: 'Upcoming Elections', payload: 'Upcoming Elections' },
  { content_type: 'text', title: 'Registered to Vote', payload: 'Registered to Vote' },
  { content_type: 'text', title: 'Voter ID Rules', payload: 'Voter ID Rules' },
];

const i18n = (key, inserts = {}) => {
  const translations = {
    intro_hello: `Hey there! :D I'm ${inserts.name ? `${inserts.name}, ` : ''}!`,
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
      const input = this.snapshot.input.payload;
      return nlp.message(input.text).then((nlpData) => {
        this.snapshot.nlp = nlpData;

        logger.info(nlpData);

        const entities = nlpData.entities;
        const intentMap = {
          help: 'what_can_i_do',
          greeting: 'handle_greeting',
          thanks: 'handle_thank_you',
          praise: 'handle_praise',

          voting_deadlines: 'voting.votingDeadlines',
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

          settings_city: 'setup.reset_organization',
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
        ASK_OPTIONS: 'what_can_i_do',
      }[this.snapshot.input.payload.payload];
      if (!goTo) return this.input('message');
      return goTo;
    },
  },
  what_can_i_do() {
    const elements = [
      elementTemplates.genericVotingAndElections,
    ];
    this.messagingClient.addToQuene({
      type: 'template',
      templateType: 'generic',
      elements,
    });
    this.messagingClient.addToQuene('I can help with a variety of topics! For example, ask me about voter ID requirements, registration deadlines, and a list of upcoming elections!', baseQuickReplies);
    return this.messagingClient.runQuene().then(() => 'start');
  },
  handle_greeting() {
    this.messagingClient.send('Hey there! How can I help you with elections or voting?', baseQuickReplies);
    return 'start';
  },
  handle_praise() {
    this.messagingClient.send('Thanks!! :)');
    return 'start';
  },
  handle_thank_you() {
    this.messagingClient.send('No problem!');
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
    return this.messagingClient.send('Unfortunately, I\'m still not understanding. Here are some ways I can help.')
      .then(() => 'voting.voterAssistance');
  },
};
