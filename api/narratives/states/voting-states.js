import { logger } from '../../logger';
import VotingClient from '../clients/voting-client';
import * as US_VOTE_CONSTANTS from '../../constants/voting-foundation';

export const states = {
  votingDeadlines() {
    logger.info('State: votingDeadlines');
    new VotingClient({ location: this.get('location') }).getElections().then((elections) => {
      if (elections.length === 0) {
        this.messagingClient.addToQuene('There are no upcoming elections!');
      } else {
        const quickReplies = ['Register to Vote', 'Voting Rules'].map((label) => {
          return { content_type: 'text', title: label, payload: label };
        });
        const registrationDeadline = VotingClient.getClosestRegistrationDeadline(elections,
          { returnString: true });
        if (registrationDeadline) {
          this.messagingClient.addToQuene(`Your next election registration deadline is ${registrationDeadline}`, null, quickReplies);
        } else {
          this.messagingClient.addToQuene('You have no upcoming deadlines, but that doesn\'t mean you shouldn\'t register.', null, quickReplies);
        }
      }
      this.messagingClient.runQuene().then(() => this.exit('start'));
    });
  },

  electionSchedule() {
    logger.info('State: electionSchedule');
    this.messagingClient.send('Hmmm, let me go grab the calendar!');
    new VotingClient({ location: this.get('location') }).getElections().then((elections) => {
      if (elections.length === 0) {
        this.messagingClient.addToQuene('There are no upcoming elections!');
      } else {
        elections.forEach((election) => {
          const registrationDate = election.dates.filter(date => date.kind === 'DRD')[0].date_human_readable;
          const message = `${election.title}\nElection Date: ${new Date(election.election_date).toDateString()}\n${registrationDate ? `Must Be Registered by: ${registrationDate}` : ''}`.trim();
          this.messagingClient.addToQuene(message);
        });
        const quickReplies = ['Register to Vote', 'Check Voter Registration'].map((label) => {
          return { content_type: 'text', title: label, payload: label };
        });
        this.messagingClient.addToQuene('Are you ready for the election?', null, quickReplies);
      }
      this.messagingClient.runQuene().then(() => this.exit('start'));
    });
  },

  pollInfo() {
    logger.info('State: pollInfo');
    const votingClientInstance = new VotingClient({ location: this.get('location') });
    Promise.all([
      votingClientInstance.getGeneralStateInfo(),
    ]).then((data) => {
      const stateInfo = data[0];

      const quickActions = [];
      stateInfo.lookup_tools.forEach((tool) => {
        if (tool.lookup_tool.kind === US_VOTE_CONSTANTS.POLLING_LOCATION) {
          quickActions.push({
            type: 'web_url',
            url: tool.url,
            title: 'Poll Location Finder',
            webview_height_ratio: 'tall',
          });
        }
        if (tool.lookup_tool.kind === US_VOTE_CONSTANTS.ELECTION_INFORMATION) {
          quickActions.push({
            type: 'web_url',
            url: tool.url,
            title: 'State Election Website',
            webview_height_ratio: 'tall',
          });
        }
      });
      this.messagingClient.send(`This what I know about the polls. ${VotingClient.extractPollDetails(stateInfo.voting_general_info)}`, {
        type: 'template',
        templateType: 'button',
      }, quickActions);
    });
  },

  voterRegistrationCheck() {
    logger.info('State: voterRegistrationCheck');
    const quickActions = [];
    new VotingClient({ location: this.get('location') }).getGeneralStateInfo().then((info) => {
      info.lookup_tools.forEach((tool) => {
        if (tool.lookup_tool.kind === US_VOTE_CONSTANTS.REGISTRATION_STATUS) {
          quickActions.push({
            type: 'web_url',
            url: tool.url,
            title: 'Am I registered?',
            webview_height_ratio: 'tall',
          });
        }
      });
      this.messagingClient.send('Here\'s a way to check registration:', {
        type: 'template',
        templateType: 'button',
      }, quickActions);
    });
  },

  voterRegistrationGet() {
    logger.info('State: voterRegistrationGet');
    this.messagingClient.addToQuene('Let\'s get you registered!');
    const votingClientInstance = new VotingClient({ location: this.get('location') });
    Promise.all([
      votingClientInstance.getGeneralStateInfo(),
      votingClientInstance.getElections(),
    ]).then((data) => {
      const stateInfo = data[0];
      const electionsInfo = data[1];

      this.messagingClient.addToQuene(VotingClient.extractRegistrationDetails(
        stateInfo.voting_general_info));
      const registrationDeadline = VotingClient.getClosestRegistrationDeadline(electionsInfo,
        { returnString: true });
      if (registrationDeadline) this.messagingClient.addToQuene(`Your next election registration deadline is ${registrationDeadline}`);
      const elements = [{
        title: 'Register to Vote',
        // image_url: 'https://scontent-lga3-1.xx.fbcdn.net/v/t31.0-8/16586922_193481711133587_230696876501689696_o.png?oh=673cb117bfa13f9bc3f603f07f6ba459&oe=5949437E',
        buttons: [],
      }];
      stateInfo.lookup_tools.forEach((tool) => {
        if (tool.lookup_tool.kind === US_VOTE_CONSTANTS.REGISTRATION_STATUS) {
          elements[0].buttons.push({
            type: 'web_url',
            url: tool.url,
            title: 'Am I registered?',
            webview_height_ratio: 'tall',
          });
        }
        if (tool.lookup_tool.kind === 'online_registration') {
          elements[0].buttons.push({
            type: 'web_url',
            url: tool.url,
            title: 'Register Online',
            webview_height_ratio: 'tall',
          });
        }
        if (tool.lookup_tool.kind === US_VOTE_CONSTANTS.ELECTION_INFORMATION) {
          elements[0].default_action = {
            type: 'web_url',
            url: tool.url,
            webview_height_ratio: 'tall',
          };
        }
      });
      this.messagingClient.addToQuene(null, {
        type: 'template',
        templateType: 'generic',
        elements,
      });
      this.messagingClient.runQuene();
    });
  },

  sampleBallot() {
    logger.info('State: sampleBallot');
    new VotingClient({ location: this.get('location') }).getGeneralStateInfo().then((info) => {
      info.lookup_tools.forEach((tool) => {
        if (tool.lookup_tool.kind === 'sample_ballot') {
          this.messagingClient.send(`Check here for a sample ballot: ${tool.url}`);
        }
      });
    });
  },

  absenteeVote() {
    logger.info('State: absenteeVote');
    new VotingClient({ location: this.get('location') }).getGeneralStateInfo().then((info) => {
      const absenteeVotingDetails = VotingClient.extractAbsenteeVoteDetails(
        info.voting_general_info);
      if (absenteeVotingDetails) {
        this.messagingClient.send(`${absenteeVotingDetails}`);
      } else {
        this.messagingClient.send('Hmm, your state doesn\'t seem to allow absentee voting.');
      }
    });
  },

  earlyVoting() {
    logger.info('State: earlyVoting');
    new VotingClient({ location: this.get('location') }).getGeneralStateInfo().then((info) => {
      const earlyVotingDetails = VotingClient.extractEarlyVotingDetails(
        info.voting_general_info);
      if (earlyVotingDetails) {
        this.messagingClient.send(`${earlyVotingDetails}`);
      } else {
        this.messagingClient.send('Hmm, it doesn\'t seem that your state allows early voting.');
      }
    });
  },

  voterIdRequirements() {
    logger.info('State: voterIdRequirements');
    new VotingClient({ location: this.get('location') }).getGeneralStateInfo().then((info) => {
      // Identification
      let idMessage = '';
      info.identification_requirements.forEach((idRequirement) => {
        if (idRequirement.category.kind === 'voter_registration') {
          idMessage = idMessage.concat(`\n${idRequirement.header} `);
          idRequirement.items.forEach((idItem, index) => {
            idMessage = idMessage.concat(`\r${index + 1}) ${idItem.item.name}. `);
          });
        }
      });
      const quickReplies = ['Register to Vote', 'Check Registration', 'Upcoming Elections'].map((label) => {
        return { content_type: 'text', title: label, payload: label };
      });
      this.messagingClient.addToQuene(idMessage, null, quickReplies);
      this.messagingClient.runQuene().then(() => this.exit('start'));
    });
  },

  stateVotingRules() {
    logger.info('State: stateVotingRules');
    new VotingClient({ location: this.get('location') }).getGeneralStateInfo().then((info) => {
      // Eligibility
      let eligibleMessage = `${info.eligibility_requirements[0].header} `;
      info.eligibility_requirements[0].items.forEach(({ item }, index) => {
        eligibleMessage = eligibleMessage.concat(`${index + 1}) ${item.name}. `);
      });
      this.messagingClient.addToQuene(eligibleMessage);
      let notEligibleMessage = `\n${info.eligibility_requirements[1].header} `;
      info.eligibility_requirements[1].items.forEach(({ item }, index) => {
        notEligibleMessage = notEligibleMessage.concat(`${index + 1}) ${item.name}. `);
      });
      const quickActions = ['Check Registration', 'Register to Vote', 'Upcoming Elections'].map((label) => {
        return { content_type: 'text', title: label, payload: label };
      });
      this.messagingClient.addToQuene(notEligibleMessage, null, quickActions);
      this.messagingClient.runQuene().then(() => this.exit('start'));
    });
  },

  voterProblem() {
    logger.info('State: voterProblem');
    const quickActions = [{
      type: 'phone_number',
      title: 'Call English Hotline',
      payload: '+18666878683',
    }, {
      type: 'phone_number',
      title: 'Call Spanish Hotline',
      payload: '+18888398682',
    }, {
      type: 'phone_number',
      title: 'Call for Other',
      payload: '+18882748683',
    }];
    this.messagingClient.send('Is someone preventing you from voting? Call any of the below numbers:', {
      type: 'template',
      templateType: 'button',
    }, quickActions);
    this.exit('start');
  },

  voterAssistance() {
    logger.info('State: voterAssistance');
    const votingClientInstance = new VotingClient({ location: this.get('location') });
    Promise.all([
      votingClientInstance.getGeneralStateInfo(),
    ]).then((data) => {
      const stateInfo = data[0];

      const elements = [{
        title: 'Voting Help Menu',
        image_url: 'https://scontent-lga3-1.xx.fbcdn.net/v/t31.0-8/16586922_193481711133587_230696876501689696_o.png?oh=673cb117bfa13f9bc3f603f07f6ba459&oe=5949437E',
        buttons: [{
          type: 'postback',
          title: 'Check Voter Registration',
          payload: 'Check Voter Registration',
        }, {
          type: 'postback',
          title: 'Register to Vote',
          payload: 'Register to Vote',
        }],
      }];
      stateInfo.lookup_tools.forEach((tool) => {
        if (tool.lookup_tool.kind === US_VOTE_CONSTANTS.ELECTION_INFORMATION) {
          elements[0].buttons.push({
            type: 'web_url',
            url: tool.url,
            webview_height_ratio: 'tall',
          });
        }
      });
      this.messagingClient.addToQuene(null, {
        type: 'template',
        templateType: 'generic',
        elements,
      });
      this.messagingClient.runQuene();
    });
  },

};
