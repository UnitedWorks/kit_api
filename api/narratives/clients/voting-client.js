import axios from 'axios';

export default class VotingClient {
  constructor(config) {
    // Setup ENV
    this.LE_API = process.env.US_VOTE_LOCAL_ELECTIONS_API_URL;
    this.localElectionsAxios = axios.create({
      headers: {
        Authorization: `Token ${process.env.US_VOTE_LOCAL_ELECTIONS_API_KEY}`,
      },
    });
    this.EOD_API = process.env.US_VOTE_ELECTION_OFFICIAL_DIRECTORY_API_URL;
    this.electionOfficialsDirectoryAxios = axios.create({
      headers: {
        Authorization: `Token ${process.env.US_VOTE_ELECTION_OFFICIAL_DIRECTORY_API_KEY}`,
      },
    });
    // Setup config variables
    const city = config.location.address.city || config.location.address.town;
    const county = config.location.address.county;
    const state = config.location.address.state;
    this.locations = {
      original: config.location,
      openStreetMap: {
        county: county ? county.toLowerCase().replace(/\s/g, '_') : null,
        state: state ? state.toLowerCase() : null,
      },
      usVote: {
        county: county ? county.toLowerCase().replace(/\s/g, '+') : null,
        state: state ? state.toLowerCase().replace(/\s/g, '+') : null,
        city: city ? city.toLowerCase().replace(/\s/, '+') : null,
      },
    };
  }

  setLocationIds() {
    // Axios is doing something weird with '+' signs
    const stateRequest = this.localElectionsAxios.get(`${this.LE_API}/locations?location_type=state&location_name=${this.locations.usVote.state}`);
    return Promise.all([stateRequest]).then((res) => {
      if (res[0].data.objects.length > 0) this.locations.usVote.stateId = res[0].data.objects[0].id;
    });
  }

  getElections() {
    return this.setLocationIds().then(() => {
      const stateElections = this.localElectionsAxios.get(`${this.LE_API}/elections`, {
        params: {
          state_id: this.locations.usVote.stateId,
          election_level_id: '1',
        },
      });
      const federalElections = this.localElectionsAxios.get(`${this.LE_API}/elections`, {
        params: {
          state_id: this.locations.usVote.stateId,
          election_level_id: '18',
        },
      });
      const cityElections = this.localElectionsAxios.get(`${this.LE_API}/elections`, {
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
      return this.localElectionsAxios.get(`${this.LE_API}/state_voter_information`, {
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

  getRegionIds() {
    const regionIds = {
      countyIds: [],
      municipalityIds: [],
    };
    let regionQueryURL = `${this.EOD_API}/regions?state_name=${this.locations.usVote.state}`;
    if (this.locations.usVote.county) {
      regionQueryURL = regionQueryURL.concat(`&county_name__icontains=${this.locations.usVote.county.slice(0, this.locations.usVote.county.indexOf('+'))}`);
    } else {
      regionQueryURL = regionQueryURL.concat(`&region_name__icontains=${this.locations.usVote.city}`);
    }
    return this.electionOfficialsDirectoryAxios.get(regionQueryURL).then(({ data }) => {
      function pushRegion(region) {
        regionIds.municipalityIds.push(region.id);
        const countyId = /\d+$/.exec(region.county)[0];
        if (!regionIds.countyIds.includes(countyId)) {
          regionIds.countyIds.push(countyId);
        }
      }
      // If we have more than one result, save county id, and try filtering for municipality
      if (data.objects.length === 1) {
        pushRegion(data.objects[0]);
        return regionIds;
      }
      data.objects.filter(object => object.region_name.includes(this.locations.original.city))
        .forEach(region => pushRegion(region));
      return regionIds;
    });
  }

  getLocalElectionOffice() {
    return this.getRegionIds().then((ids) => {
      if ((ids.countyIds.length + ids.municipalityIds.length) > 10) throw Error('Too many IDs returned');
      const municipalityRequests = [];
      ids.municipalityIds.forEach((id) => {
        municipalityRequests.push(this.electionOfficialsDirectoryAxios.get(`${this.EOD_API}/offices?region=${id}`));
      });
      // Check Municipalities first
      return Promise.all(municipalityRequests).then((muniResults) => {
        const foundOffices = muniResults.filter(response => response.data.objects.length > 0);
        if (typeof foundOffices[0] === 'object') {
          return { office: foundOffices[0].data.objects[0] };
        }
        const countyRequests = [];
        ids.countyIds.forEach((id) => {
          countyRequests.push(this.electionOfficialsDirectoryAxios.get(`${this.EOD_API}/offices?region=${id}`));
        });
        return Promise.all(countyRequests).then((countyResults) => {
          const foundCountyOffices = countyResults.filter(
            response => response.data.objects.length > 0);
          return typeof foundCountyOffices[0] === 'object' ?
            { office: foundCountyOffices[0].data.objects[0] } : null;
        });
      });
    });
  }

}
