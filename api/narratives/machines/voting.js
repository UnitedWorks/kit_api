import { logger } from '../../logger';
import VotingClient from '../clients/voting-client';
import * as US_VOTE_CONSTANTS from '../../constants/voting-foundation';
import { getPlacesUrl } from '../../utils';

export default {
  votingDeadlines() {
    logger.info('State: votingDeadlines');
    return new VotingClient({ location: this.get('location') }).getElections().then((elections) => {
      if (elections.length === 0) {
        this.messagingClient.addToQuene('There are no upcoming elections!');
      } else {
        const quickReplies = ['Register to Vote', 'Voting Rules'].map((label) => {
          return { content_type: 'text', title: label, payload: label };
        });
        const registrationDeadline = VotingClient.getClosestRegistrationDeadline(elections,
          { returnString: true });
        if (registrationDeadline) {
          this.messagingClient.addToQuene(`Your next election registration deadline is ${registrationDeadline}`, quickReplies);
        } else {
          this.messagingClient.addToQuene('You have no upcoming deadlines, but that doesn\'t mean you shouldn\'t register.', quickReplies);
        }
      }

      return this.messagingClient.runQuene().then(() => 'smallTalk.start');
    });
  },

  electionSchedule() {
    logger.info('State: electionSchedule');
    this.messagingClient.send('Hmmm, let me go grab the calendar!');
    return new VotingClient({ location: this.get('location') }).getElections().then((elections) => {
      if (elections.length === 0) {
        this.messagingClient.addToQuene('There are no upcoming elections!');
      } else {
        let earliestRegistrationDate;
        elections.forEach((election) => {
          const elements = [];
          elements.push({
            title: election.title,
            subtitle: new Date(election.election_date).toDateString(),
            image_url: 'https://scontent-lga3-1.xx.fbcdn.net/v/t31.0-8/16586922_193481711133587_230696876501689696_o.png?oh=673cb117bfa13f9bc3f603f07f6ba459&oe=5949437E',
          });
          election.dates.filter(date => ['DRD', 'DBRD', 'EVF'].includes(date.kind)).map((electionDate) => {
            if (electionDate.date_type.default === true) {
              if (electionDate.kind === 'DRD') earliestRegistrationDate = new Date(electionDate.date);
              elements.push({
                title: US_VOTE_CONSTANTS[electionDate.kind],
                subtitle: electionDate.date_human_readable,
              });
            }
          });
          this.messagingClient.addToQuene({
            type: 'template',
            templateType: 'list',
            elements,
            buttons: [{
              type: 'web_url',
              title: election.urls[0].name,
              url: election.urls[0].url,
              webview_height_ratio: 'tall',
            }],
          });
        });
        const quickReplies = ['Register to Vote', 'Am I Registered?'].map((label) => {
          return { content_type: 'text', title: label, payload: label };
        });
        this.messagingClient.addToQuene(`You have ${Math.floor((earliestRegistrationDate.getTime() - Date.now()) / 86400000)} days left to register. Are you ready for the elections?`, quickReplies);
      }
      return this.messagingClient.runQuene().then(() => 'smallTalk.start');
    });
  },

  pollInfo() {
    logger.info('State: pollInfo');
    const votingClientInstance = new VotingClient({ location: this.get('location') });
    return Promise.all([
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
      this.messagingClient.send({
        type: 'template',
        templateType: 'button',
        text: `This what I know about the polls. ${VotingClient.extractPollDetails(stateInfo.voting_general_info)}`,
        buttons: quickActions,
      });

      return 'smallTalk.start';
    });
  },

  voterRegistrationCheck() {
    // Check for location. If none, set redirect back to this state once location is set
    if (this.get('location') === undefined) {
      this.messagingClient.send('Ok! First, what CITY and STATE are you located in?');
      if (this.get('stateRedirects')) {
        this.set('stateRedirects', [{
          whenExiting: 'setup.waiting_organization_confirm',
          exitWas: 'smallTalk.askOptions',
          goTo: 'voting.voterRegistrationCheck',
        }].concat(this.get('stateRedirects')));
      }
      return 'setup.waiting_organization';
    }
    // State
    const quickActions = [];
    return new VotingClient({ location: this.get('location') }).getGeneralStateInfo().then((info) => {
      info.lookup_tools.forEach((tool) => {
        if (tool.lookup_tool.kind === US_VOTE_CONSTANTS.REGISTRATION_STATUS) {
          quickActions.push({
            type: 'web_url',
            url: tool.url,
            title: 'Check Registration',
            webview_height_ratio: 'tall',
          });
        }
      });
      return this.messagingClient.send({
        type: 'template',
        templateType: 'button',
        text: `Here's a way to check if your registered in ${this.get('location').address.state}:`,
        buttons: quickActions,
      }).then(() => {
        if (this.get('stateRedirects') &&
            this.get('stateRedirects')[0].whenExiting.includes('voterRegistrationCheck')) {
          return this.get('stateRedirects')[0].goTo;
        }
        return 'smallTalk.start';
      });
    });
  },

  voterRegistrationGet() {
    // Check for location. If none, set redirect back to this state once location is set
    if (this.get('location') === undefined) {
      this.messagingClient.send('Ok! First, what CITY and STATE are you located in?');
      if (this.get('stateRedirects')) {
        this.set('stateRedirects', [{
          whenExiting: 'setup.waiting_organization_confirm',
          exitWas: 'smallTalk.askOptions',
          goTo: 'voting.voterRegistrationGet',
        }].concat(this.get('stateRedirects')));
      }
      return 'setup.waiting_organization';
    }
    this.messagingClient.addToQuene('Let\'s get you registered!');
    const votingClientInstance = new VotingClient({ location: this.get('location') });
    return Promise.all([
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
        title: `Register to Vote in ${this.get('location').address.state}`,
        buttons: [],
      }];
      stateInfo.lookup_tools.forEach((tool) => {
        if (tool.lookup_tool.kind === US_VOTE_CONSTANTS.REGISTRATION_STATUS) {
          elements[0].buttons.push({
            type: 'web_url',
            url: tool.url,
            title: 'Check Registration',
            webview_height_ratio: 'tall',
          });
        }
        if (tool.lookup_tool.kind === US_VOTE_CONSTANTS.ONLINE_REGISTRATION) {
          elements[0].buttons.push({
            type: 'web_url',
            url: tool.url,
            title: 'Register Online',
            webview_height_ratio: 'tall',
          });
        }
        if (tool.lookup_tool.kind === US_VOTE_CONSTANTS.ELECTION_INFORMATION) {
          const baseOptions = {
            type: 'web_url',
            url: tool.url,
            webview_height_ratio: 'tall',
          };
          elements[0].default_action = baseOptions;
          elements[0].buttons.push({
            ...baseOptions,
            title: 'Election Website',
          });
        }
      });
      this.messagingClient.addToQuene({
        type: 'template',
        templateType: 'generic',
        elements,
      });
      return this.messagingClient.runQuene().then(() => {
        if (this.get('stateRedirects') &&
            this.get('stateRedirects')[0].whenExiting.includes('voterRegistrationGet')) {
          return this.get('stateRedirects')[0].goTo;
        }
        return 'smallTalk.start';
      });
    });
  },

  sampleBallot() {
    logger.info('State: sampleBallot');
    return new VotingClient({ location: this.get('location') }).getGeneralStateInfo().then((info) => {
      info.lookup_tools.forEach((tool) => {
        if (tool.lookup_tool.kind === 'sample_ballot') {
          this.messagingClient.send(`Check here for a sample ballot: ${tool.url}`);
        }
      });

      return 'smallTalk.start';
    });
  },

  absenteeVote() {
    logger.info('State: absenteeVote');
    return new VotingClient({ location: this.get('location') }).getGeneralStateInfo().then((info) => {
      const absenteeVotingDetails = VotingClient.extractAbsenteeVoteDetails(
        info.voting_general_info);
      if (absenteeVotingDetails) {
        this.messagingClient.send(`${absenteeVotingDetails}`);
      } else {
        this.messagingClient.send('Hmm, your state doesn\'t seem to allow absentee voting.');
      }
      return 'smallTalk.start';
    });
  },

  earlyVoting() {
    logger.info('State: earlyVoting');
    return new VotingClient({ location: this.get('location') }).getGeneralStateInfo().then((info) => {
      const earlyVotingDetails = VotingClient.extractEarlyVotingDetails(
        info.voting_general_info);
      if (earlyVotingDetails) {
        this.messagingClient.send(`${earlyVotingDetails}`);
      } else {
        this.messagingClient.send('Hmm, it doesn\'t seem that your state allows early voting.');
      }
      return 'smallTalk.start';
    });
  },

  voterIdRequirements() {
    logger.info('State: voterIdRequirements');
    return new VotingClient({ location: this.get('location') }).getGeneralStateInfo().then((info) => {
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
      this.messagingClient.addToQuene(idMessage, quickReplies);
      return this.messagingClient.runQuene().then(() => 'smallTalk.start');
    });
  },

  stateVotingRules() {
    logger.info('State: stateVotingRules');
    return new VotingClient({ location: this.get('location') }).getGeneralStateInfo().then((info) => {
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
      this.messagingClient.addToQuene(notEligibleMessage, quickActions);
      return this.messagingClient.runQuene().then(() => 'smallTalk.start');
    });
  },

  voterProblem() {
    logger.info('State: voterProblem');
    return new VotingClient({ location: this.get('location') }).getLocalElectionOffice().then((info) => {
      if (info.office) {
        const officeElements = [{
          title: info.office.express_address.address_to || 'Elections Office',
          buttons: [],
        }];
        if (info.office.website) {
          officeElements[0].buttons.push({
            type: 'web_url',
            title: 'Website',
            url: info.office.website,
            webview_height_ratio: 'tall',
          });
        }
        if (info.office.hours) officeElements[0].subtitle = `Hours: ${info.office.hours}`;
        if (info.office.mailing_address) {
          officeElements[0].buttons.push({
            type: 'web_url',
            title: 'View Location',
            url: getPlacesUrl(`${info.office.mailing_address.street1} ${info.office.mailing_address.city} ${info.office.mailing_address.state} ${info.office.mailing_address.zip}}`),
          });
        }
        this.messagingClient.addToQuene('If you need more help, here\'s a nearby election office:');
        this.messagingClient.addToQuene({
          type: 'template',
          templateType: 'generic',
          elements: officeElements,
        });
      } else {
        this.messagingClient.addToQuene('Unfortunately, I was unable to find an elections office for you :(');
      }
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
      this.messagingClient.addToQuene({
        type: 'template',
        templateType: 'button',
        text: 'If someone is preventing you from voting call these hotlines:',
        buttons: quickActions,
      });
      return this.messagingClient.runQuene().then(() => 'smallTalk.start');
    });
  },

  voterAssistance() {
    logger.info('State: voterAssistance');
    const votingClientInstance = new VotingClient({ location: this.get('location') });
    return Promise.all([
      votingClientInstance.getGeneralStateInfo(),
    ]).then((data) => {
      const stateInfo = data[0];

      const elements = [{
        title: 'Voting Help Menu',
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
            title: 'State Election Website',
            url: tool.url,
            webview_height_ratio: 'tall',
          });
        }
      });
      this.messagingClient.addToQuene({
        type: 'template',
        templateType: 'generic',
        elements,
      });
      return this.messagingClient.runQuene().then(() => 'smallTalk.start');
    });
  },

};
