import { logger } from '../../logger';
import VotingClient from '../clients/voting-client';

export const states = {
  electionDeadlines() {
    logger.info('State: electionDeadlines');
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

  earlyVoting() {
    logger.info('State: earlyVoting');
    this.messagingClient.send('I don\'t have that information yet. :(');
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
        if (tool.lookup_tool.kind === 'polling_location') {
          quickActions.push({
            type: 'web_url',
            url: tool.url,
            title: 'Poll Location Finder',
            webview_height_ratio: 'tall',
          });
        }
        if (tool.lookup_tool.kind === 'election_information') {
          quickActions.push({
            type: 'web_url',
            url: tool.url,
            title: 'State Election Website',
            webview_height_ratio: 'tall',
          });
        }
      });
      this.messagingClient.send(`${VotingClient.extractPollDetails(stateInfo.voting_general_info) || 'This is what I found to help with poll information.'}`, {
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
        if (tool.lookup_tool.kind === 'registration_status') {
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
    this.messagingClient.addToQuene('Alright, let\'s get you registered!');
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
        title: 'Get Registered!',
        image_url: 'https://scontent-lga3-1.xx.fbcdn.net/v/t31.0-8/16586922_193481711133587_230696876501689696_o.png?oh=673cb117bfa13f9bc3f603f07f6ba459&oe=5949437E',
        buttons: [],
      }];
      stateInfo.lookup_tools.forEach((tool) => {
        if (tool.lookup_tool.kind === 'registration_status') {
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
        if (tool.lookup_tool.kind === 'election_information') {
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

  voterRegistrationHelp() {
    logger.info('State: voterRegistrationHelp');
    const quickReplies = ['Register to Vote', 'Check Voter Registration', 'Voter ID Requirements'].map((label) => {
      return { content_type: 'text', title: label, payload: label };
    });
    this.messagingClient.send('How can I help you with voter registration?', null, quickReplies);
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

  voterAssistance() {
    logger.info('State: voterAssistance');
    const quickReplies = ['Where is my poll?', 'Get Upcoming Elections', 'Voter Issue Help'].map((label) => {
      return { content_type: 'text', title: label, payload: label };
    });
    this.messagingClient.send('How can I help you with voting?', null, quickReplies);
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
      this.messagingClient.addToQuene(idMessage);
      const quickReplies = ['Register to Vote', 'Check Voter Registration', 'Upcoming Elections'].map((label) => {
        return { content_type: 'text', title: label, payload: label };
      });
      this.messagingClient.addToQuene('Since we\'re on the topic, are you ready for the next election?', null, quickReplies);
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
      eligibleMessage = eligibleMessage.concat(`\n${info.eligibility_requirements[1].header} `);
      info.eligibility_requirements[1].items.forEach(({ item }, index) => {
        eligibleMessage = eligibleMessage.concat(`${index + 1}) ${item.name}. `);
      });
      this.messagingClient.addToQuene(eligibleMessage);
      // More info
      const quickReplies = ['Voter ID Requirements', 'Register to Vote'].map((label) => {
        return { content_type: 'text', title: label, payload: label };
      });
      this.messagingClient.addToQuene('Here are Some other ways I can help you with voting: ', null, quickReplies);
      this.messagingClient.runQuene().then(() => this.exit('start'));
    });
  },

  electionProblem() {
    logger.info('State: electionProblem');
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

  electionHelp() {
    logger.info('State: electionHelp');
    const quickReplies = ['Upcoming Elections', 'Voting Requirements', 'Register to Vote'].map((label) => {
      return { content_type: 'text', title: label, payload: label };
    });
    this.messagingClient.send('How can I help you with voting or the elections?', null, quickReplies);
    this.exit('start');
  },

};
