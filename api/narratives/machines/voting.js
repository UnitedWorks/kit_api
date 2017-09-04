import VotingClient from '../clients/voting-client';
import * as US_VOTE_CONSTANTS from '../../constants/voting-foundation';
import { getPlacesUrl } from '../../utils';
import { i18n } from '../templates/messages';

export default {
  votingDeadlines() {
    if (!this.get('location') || !this.get('location').address) return this.stateRedirect('location', 'voting.votingDeadlines');
    return new VotingClient({ location: this.get('location') }).getElections().then((elections) => {
      this.messagingClient.addToQuene(i18n('us_vote_attribution'));
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
      return this.messagingClient.runQuene().then(() => this.getBaseState());
    });
  },

  electionSchedule() {
    if (!this.get('location') || !this.get('location').address) return this.stateRedirect('location', 'voting.electionSchedule');
    this.messagingClient.send('Hmmm, let me go grab the calendar!');
    return new VotingClient({ location: this.get('location') }).getElections().then((elections) => {
      this.messagingClient.addToQuene(i18n('us_vote_attribution'));
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
            elements: elements.length > 1 ? elements : elements.concat({ title: 'No deadlines found', subtitle: 'Please visit the linked elections website' }),
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
      this.messagingClient.runQuene();
      return this.getBaseState();
    });
  },

  pollInfo() {
    const votingClientInstance = new VotingClient({ location: this.get('location') });
    return Promise.all([
      votingClientInstance.getGeneralStateInfo(),
    ]).then((data) => {
      const stateInfo = data[0];
      const quickActions = [];
      this.messagingClient.addToQuene(i18n('us_vote_attribution'));
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
      this.messagingClient.addToQuene({
        type: 'template',
        templateType: 'button',
        text: `This what I know about the polls. ${VotingClient.extractPollDetails(stateInfo.voting_general_info)}`,
        buttons: quickActions,
      });
      this.messagingClient.runQuene();
      return this.getBaseState();
    });
  },

  voterRegistrationCheck() {
    if (!this.get('location') || !this.get('location').address) return this.stateRedirect('location', 'voting.voterRegistrationCheck');
    const quickActions = [];
    return new VotingClient({ location: this.get('location') }).getGeneralStateInfo().then((info) => {
      this.messagingClient.addToQuene(i18n('us_vote_attribution'));
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
      this.messagingClient.addToQuene({
        type: 'template',
        templateType: 'button',
        text: `Here's a way to check if your registered in ${this.get('location').address.state}:`,
        buttons: quickActions,
      });
      this.messagingClient.runQuene();
      return this.checkMultiRedirect('voterRegistrationCheck', this.getBaseState());
    });
  },

  voterRegistrationGet() {
    if (!this.get('location') || !this.get('location').address) return this.stateRedirect('location', 'voting.voterRegistrationGet');
    this.messagingClient.addToQuene('Let\'s get you registered!');
    const votingClientInstance = new VotingClient({ location: this.get('location') });
    return Promise.all([
      votingClientInstance.getGeneralStateInfo(),
      votingClientInstance.getElections(),
    ]).then((data) => {
      const stateInfo = data[0];
      const electionsInfo = data[1];
      this.messagingClient.addToQuene(i18n('us_vote_attribution'));
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
      this.messagingClient.runQuene();
      return this.checkMultiRedirect('voterRegistrationGet', this.getBaseState());
    });
  },

  sampleBallot() {
    if (!this.get('location') || !this.get('location').address) return this.stateRedirect('location', 'voting.sampleBallot');
    return new VotingClient({ location: this.get('location') }).getGeneralStateInfo().then((info) => {
      this.messagingClient.addToQuene(i18n('us_vote_attribution'));
      info.lookup_tools.forEach((tool) => {
        if (tool.lookup_tool.kind === 'sample_ballot') {
          this.messagingClient.addToQuene(`Check here for a sample ballot: ${tool.url}`);
        }
      });
      this.messagingClient.runQuene();
      return this.getBaseState();
    });
  },

  absenteeVote() {
    if (!this.get('location') || !this.get('location').address) return this.stateRedirect('location', 'voting.absenteeVote');
    return new VotingClient({ location: this.get('location') }).getGeneralStateInfo().then((info) => {
      const absenteeVotingDetails = VotingClient.extractAbsenteeVoteDetails(
        info.voting_general_info);
      this.messagingClient.addToQuene(i18n('us_vote_attribution'));
      if (absenteeVotingDetails) {
        this.messagingClient.addToQuene(`${absenteeVotingDetails}`);
      } else {
        this.messagingClient.addToQuene('Hmm, your state doesn\'t seem to allow absentee voting.');
      }
      this.messagingClient.runQuene();
      return this.getBaseState();
    });
  },

  earlyVoting() {
    if (!this.get('location') || !this.get('location').address) return this.stateRedirect('location', 'voting.earlyVoting');
    return new VotingClient({ location: this.get('location') }).getGeneralStateInfo().then((info) => {
      const earlyVotingDetails = VotingClient.extractEarlyVotingDetails(
        info.voting_general_info);
      this.messagingClient.addToQuene(i18n('us_vote_attribution'));
      if (earlyVotingDetails) {
        this.messagingClient.addToQuene(`${earlyVotingDetails}`);
      } else {
        this.messagingClient.addToQuene('Hmm, it doesn\'t seem that your state allows early voting.');
      }
      this.messagingClient.runQuene();
      return this.getBaseState();
    });
  },

  voterIdRequirements() {
    if (!this.get('location') || !this.get('location').address) return this.stateRedirect('location', 'voting.voterIdRequirements');
    return new VotingClient({ location: this.get('location') }).getGeneralStateInfo().then((info) => {
      this.messagingClient.addToQuene(i18n('us_vote_attribution'));
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
      this.messagingClient.runQuene();
      return this.getBaseState();
    });
  },

  stateVotingRules() {
    if (!this.get('location') || !this.get('location').address) return this.stateRedirect('location', 'voting.stateVotingRules');
    return new VotingClient({ location: this.get('location') }).getGeneralStateInfo().then((info) => {
      this.messagingClient.addToQuene(i18n('us_vote_attribution'));
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
      this.messagingClient.runQuene();
      return this.getBaseState();
    });
  },

  voterProblem() {
    if (!this.get('location') || !this.get('location').address) return this.stateRedirect('location', 'voting.voterProblem');
    return new VotingClient({ location: this.get('location') }).getLocalElectionOffice().then((info) => {
      this.messagingClient.addToQuene(i18n('us_vote_attribution'));
      if (info && info.office) {
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
      }];
      this.messagingClient.addToQuene({
        type: 'template',
        templateType: 'button',
        text: 'If someone is preventing you from voting call these hotlines:',
        buttons: quickActions,
      });
      this.messagingClient.runQuene();
      return this.getBaseState();
    });
  },

  voterAssistance() {
    if (!this.get('location') || !this.get('location').address) return this.stateRedirect('location', 'voting.voterAssistance');
    const votingClientInstance = new VotingClient({ location: this.get('location') });
    return Promise.all([
      votingClientInstance.getGeneralStateInfo(),
    ]).then((data) => {
      this.messagingClient.addToQuene(i18n('us_vote_attribution'));
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
      this.messagingClient.runQuene();
      return this.getBaseState();
    });
  },

};
