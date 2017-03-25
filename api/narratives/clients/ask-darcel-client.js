import axios from 'axios';

export default class AskDarcelClient {
  constructor(config = {}) {
    this.apiUrl = 'https://www.askdarcel.org/api/resources';
    this.location = config.location;
    this.categoryIdMap = {
      shelter: 1,
      food: 2,
      medical: 3,
      hygiene: 4,
      technology: 5,
      money: 6,
    };
  }

  getResources(category, options = {}) {
    const parameters = {
      category_id: this.categoryIdMap[category],
      lat: this.location.lat,
      long: this.location.lon,
    };
    if (options.location) {
      parameters.lat = parameters.location.lat;
      parameters.long = parameters.location.lon;
    }
    return axios.get(this.apiUrl, { params: parameters })
      .then((response) => {
        return response.data.resources.slice(0, options.limit || 3);
      })
      .catch((error) => {
        return { error };
      });
  }
}
