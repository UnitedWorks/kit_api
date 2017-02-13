import { logger } from '../../logger';
import VotingClient from '../clients/voting-client';

export const states = {
  electionDeadlines() {
    logger.info('State: electionDeadlines');
    this.messagingClient.send('I don\'t have that information yet. :(');
  },

  electionSchedule() {
    logger.info('State: electionSchedule');
    new VotingClient({ location: this.get('location') }).getElections().then((elections) => {
      if (elections.length === 0) {
        this.messagingClient.addToQuene('There are no upcoming elections!');
      } else {
        this.messagingClient.addToQuene('Your upcoming elections:');
        elections.forEach((election) => {
          const registrationDate = election.dates.filter(date => date.kind === 'DRD')[0].date_human_readable;
          const message = `${election.title}\nElection Date: ${new Date(election.election_date).toDateString()}\n${registrationDate ? `Register By: ${registrationDate}` : ''}`.trim();
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

  pollLocations() {
    logger.info('State: pollLocations');
    new VotingClient({ location: this.get('location') }).getGeneralStateInfo().then((info) => {
      info.lookup_tools.forEach((tool) => {
        if (tool.lookup_tool.kind === 'polling_location') {
          this.messagingClient.send(`This should help you find your polls: ${tool.url}`);
        }
      });
    });
  },

  voterRegistrationCheck() {
    logger.info('State: voterRegistrationCheck');
    new VotingClient({ location: this.get('location') }).getGeneralStateInfo().then((info) => {
      info.lookup_tools.forEach((tool) => {
        if (tool.lookup_tool.kind === 'registration_status') {
          this.messagingClient.send(`This should help you check your registration: ${tool.url}`);
        }
      });
    });
  },

  voterRegistrationGet() {
    logger.info('State: voterRegistrationGet');
    this.messagingClient.send('I don\'t have that information yet. :(');
  },

  voterRegistrationHelp() {
    logger.info('State: voterRegistrationHelp');
    const quickReplies = ['Register to Vote', 'Check Voter Registration', 'Voter ID Requirements'].map((label) => {
      return { content_type: 'text', title: label, payload: label };
    });
    this.messagingClient.send('How can I help you with voter registration?', null, quickReplies);
  },

  absenteeBallot() {
    logger.info('State: absenteeBallot');
    this.messagingClient.send('I don\'t have that information yet. :(');
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
    this.messagingClient.send('I don\'t have that information yet. :(');
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
      const quickReplies = ['Voter ID Needed', 'State Elections Website'].map((label) => {
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
    const quickReplies = ['Upcoming Elections', 'Voting Requirements', 'Voting Registration'].map((label) => {
      return { content_type: 'text', title: label, payload: label };
    });
    this.messagingClient.send('How can I help you with voting or the elections?', null, quickReplies);
    this.exit('start');
  },

};
