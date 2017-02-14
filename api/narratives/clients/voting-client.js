import axios from 'axios';

export default class VotingClient {
  constructor(config) {
    // Setup ENV
    this.localElectionsAPI = process.env.US_VOTE_LOCAL_ELECTIONS_API_URL;
    this.axios = axios.create({
      headers: {
        'Authorization': `Token ${process.env.US_VOTE_LOCAL_ELECTIONS_API_KEY}`,
      },
    });
    // Setup config variables
    const level2 = config.location.administrativeLevels.level2long;
    const level1 = config.location.administrativeLevels.level1long;
    this.locations = {
      google: {
        county: level2 ? level2.toLowerCase().replace(/\s/g, '_') : null,
        state: level1 ? level1.toLowerCase() : null,
      },
      usVote: {
        county: level2 ? level2.toLowerCase().replace(/\s/g, '+') : null,
        state: level1 ? level1.toLowerCase().replace(/\s/g, '+') : null,
        city: config.location.city.toLowerCase().replace(/\s/, '+'),
      },
    };
  }

  setLocationIds() {
    // Axios is doing something weird with '+' signs
    const stateRequest = this.axios.get(`${this.localElectionsAPI}/locations?location_type=state&location_name=${this.locations.usVote.state}`);
    // const countyRequest = this.axios.get(`${this.localElectionsAPI}/locations?location_type=county&location_name=${this.locations.usVote.county}`);
    return Promise.all([stateRequest]).then((res) => {
      if (res[0].data.objects.length > 0) this.locations.usVote.stateId = res[0].data.objects[0].id;
      // if (res[1].data.objects.length > 0) {
      //   this.locations.usVote.countyId = res[1].data.objects.filter((location) => {
      //     return location.state_id === this.locations.usVote.stateId;
      //   })[0].id;
      // }
    });
  }

  getElections() {
    return this.setLocationIds().then(() => {
      const stateElections = this.axios.get(`${this.localElectionsAPI}/elections`, {
        params: {
          state_id: this.locations.usVote.stateId,
          election_level_id: '1',
        },
      });
      const federalElections = this.axios.get(`${this.localElectionsAPI}/elections`, {
        params: {
          state_id: this.locations.usVote.stateId,
          election_level_id: '18',
        },
      });
      const cityElections = this.axios.get(`${this.localElectionsAPI}/elections`, {
        params: {
          state_id: this.locations.usVote.stateId,
          election_name: this.locations.usVote.city,
        },
      });
      return Promise.all([stateElections, federalElections, cityElections]).then((res) => {
        return res[0].data.objects.concat(res[1].data.objects).concat(res[2].data.objects);
      });
    });
  }

  getGeneralStateInfo() {
    return this.setLocationIds().then(() => {
      return this.axios.get(`${this.localElectionsAPI}/state_voter_information`, {
        params: {
          state_id: this.locations.usVote.stateId,
        },
      }).then(res => res.data.objects[0]);
    });
  }

  static getClosestRegistrationDeadline(elections, options = {}) {
    let registerBy = null;
    elections.forEach((election) => {
      const thisDate = new Date(election.dates.filter(date => date.kind === 'DRD')[0].date);
      if (registerBy === null || thisDate.getTime() < registerBy) {
        registerBy = thisDate.getTime();
      }
    });
    if (Date.now() > registerBy) {
      return null;
    }
    return options.returnString ? new Date(registerBy).toDateString() : new Date(registerBy);
  }

  static extractRegistrationDetails(generalInfoTextBlock) {
    const textHeaders = generalInfoTextBlock.replace(/#{2}/gm, '').split('\n').filter(line => line.includes('#'));
    let slicedSection;
    textHeaders.forEach((header, index) => {
      if (header.includes('Registration')) {
        slicedSection = generalInfoTextBlock.slice(
          generalInfoTextBlock.indexOf(header),
          generalInfoTextBlock.indexOf(textHeaders[index + 1]));
      }
    });
    let registrationMessage = '';
    slicedSection.split('\n').filter(line => line.includes('*')).forEach((option, index, array) => {
      registrationMessage = registrationMessage.concat(`${option.replace(/\*/, '').trim()}${index === array.length - 1 ? '' : ', '}`);
    });
    return `You can register ${registrationMessage}`;
  }

  static extractPollDetails(generalInfoTextBlock) {
    const pollOptions = /(Polling [a-z0-9\s-/]+\.)/gmi.exec(generalInfoTextBlock.replace(/(?:\r\n|\r|\n)/g, ''));
    return pollOptions !== null ? pollOptions[1] : null;
  }

  static extractAbsenteeVoteDetails(generalInfoTextBlock) {
    const absenteeDescription = /Absentee Voting([a-z0-9\s-/]+\.)/gmi.exec(generalInfoTextBlock.replace(/(?:\r\n|\r|\n)/g, ''));
    return absenteeDescription !== null ? absenteeDescription[1] : null;
  }

  static extractEarlyVotingDetails(generalInfoTextBlock) {
    const earlyVotingDescription = /Early Voting ([a-z0-9\s-/]+\.)/gmi.exec(generalInfoTextBlock.replace(/(?:\r\n|\r|\n)/g, ''));
    return earlyVotingDescription !== null ? earlyVotingDescription[1] : null;
  }

}
