import { logger } from '../../logger';
import * as TAGS from '../../constants/nlp-tagging';
import { nlp } from '../../services/nlp';
import { entityValueIs } from '../helpers';
import SlackService from '../../services/slack';

const baseQuickReplies = [
  { content_type: 'text', title: 'Get Registered', payload: 'Get Registered' },
  { content_type: 'text', title: 'Upcoming Elections', payload: 'Upcoming Elections' },
  { content_type: 'text', title: 'Not Allowed to Vote', payload: 'Not Allowed to Vote' },
];

export default {
  handle_greeting() {
    this.messagingClient.send('Hey there! I\'m BallotBot. I can help you vote out the clowns or vote in the fighters representing your needs. Either way, voting matters and we\'re not going to make sure no one stops you. Want to know what upcoming elections there are and make sure you\'re registered?', baseQuickReplies);
    return 'start';
  },
  start: {
    message() {
      const input = this.snapshot.input.payload;
      return nlp.message(input.text, {}).then((nlpData) => {
        this.set('nlp', nlpData.entities);
        const entities = nlpData.entities;
        logger.info(nlpData);

        // Greeting
        if (entities[TAGS.SMALL_TALK]) {
          if (entityValueIs(entities[TAGS.SMALL_TALK], [TAGS.GREETING])) {
            return 'handle_greeting';
          }
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
        }
        return 'failedRequest';
      });
    },
  },
  failedRequest(aux = {}) {
    new SlackService({
      username: 'Misunderstood Request - US Vote',
      icon: 'question',
    }).send(`>*Request Message*: ${aux.input.payload.text}\n>*Constituent ID*: ${this.snapshot.constituent.id}`);
    const message = 'Im just a bot so I may not be understanding. I can help you find a shelter, clinics, or places to wash up';
    this.messagingClient.send(message, baseQuickReplies);
    return 'start';
  },
};
