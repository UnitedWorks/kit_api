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
    this.locations = {
      google: {
        county: config.location.administrativeLevels.level2long.toLowerCase().replace(/\s/g, '_'),
        state: config.location.administrativeLevels.level1short.toLowerCase(),
      },
      usVote: {
        county: config.location.administrativeLevels.level2long.toLowerCase().replace(/\s/g, '+'),
        state: config.location.administrativeLevels.level1long.toLowerCase().replace(/\s/g, '+'),
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

}
