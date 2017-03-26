import axios from 'axios';
import * as OSM from '../constants/open-street-maps';

export default function geocoder(input, filters = []) {
  // http://nominatim.openstreetmap.org/search?q=Queens,%20New%20York&format=json&addressdetails=1&dedupe=1&type=administrative&polygon_geojson=1
  return axios.get('http://nominatim.openstreetmap.org/search', {
    params: {
      q: input,
      format: 'json',
      addressdetails: 1,
      dedupe: 1,
      // polygon_geojson: 1,
      limit: 5,
    },
  }).then((response) => {
    if (filters.length > 0) {
      let filteredResponses = response.data.filter(object => filters.includes(object.type));
      if (filters.includes(OSM.ADMINISTRATIVE)
        || filters.includes(OSM.CITY)
        || filters.includes(OSM.TOWN)) {
        filteredResponses = filteredResponses.filter((object) => {
          return object.address.city || object.address.town;
        });
      }
      return filteredResponses;
    }
    return response.data;
  });
}
