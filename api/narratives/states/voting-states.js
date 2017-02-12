import { logger } from '../../logger';
import VotingClient from '../clients/voting-client';

export const states = {
  electionDeadlines() {
    logger.info('State: electionDeadlines');
  },
  electionSchedule() {
    logger.info('State: electionSchedule');
    new VotingClient({ location: this.get('location') }).getElections().then((elections) => {
      if (elections.length === 0) {
        this.messagingClient.send('There are no upcoming elections!');
      } else {
        this.messagingClient.addToQuene('Your upcoming elections:');
        elections.forEach((election) => {
          const registrationDate = election.dates.filter(date => date.kind === 'DRD')[0].date_human_readable;
          const message = `${election.title}\nElection Date: ${new Date(election.election_date).toDateString()}\n${registrationDate ? `Register By: ${registrationDate}` : ''}`.trim();
          this.messagingClient.addToQuene(message);
        });
        this.messagingClient.runQuene().then(() => this.exit('start'));
      }
    });
  },
  earlyVoting() {
    console.log('checking early voting');
  },
  pollLocations() {
    console.log('where are poll locations');
  },
  pollSchedule() {
    console.log('what time are polls open');
  },
  voterRegistrationCheck() {
    console.log('checking voter registration');
  },
  voterRegistrationGet() {
    console.log('getting registered to vote');
  },
  absenteeBallot() {
    console.log('get an absentee ballot');
  },
  electionHelp() {
    console.log('help');
  },
  sampleBallot() {
    console.log('get a sample ballot');
  },
  voterAssistance() {
    console.log('voter assistance hotline');
  },
};
