import axios from 'axios';
import * as OSM from '../constants/open-street-maps';

export default async function geocoder(input, filters = [], addressBoundary) {
  // http://nominatim.openstreetmap.org/search?q=Queens,%20New%20York&format=json&addressdetails=1&dedupe=1&type=administrative&polygon_geojson=1
  let finalResponse = await axios.get('http://nominatim.openstreetmap.org/search', {
    params: {
      q: input,
      format: 'json',
      addressdetails: 1,
      dedupe: 1,
      // polygon_geojson: 1,
      limit: 5,
    },
  }).then(r => r.data);

  // If addressBoundary is passed in, we need a matching state/country
  if (addressBoundary) {
    const passingLocations = finalResponse.filter(loc =>
      loc.address.country === addressBoundary.country &&
      loc.address.state === addressBoundary.state &&
      (loc.address.road || loc.address.street));
    if (passingLocations.length === 0) {
      finalResponse = await axios.get('http://nominatim.openstreetmap.org/search', {
        params: {
          q: `${input}, ${addressBoundary.city || addressBoundary.town || addressBoundary.village || ''} ${addressBoundary.state} ${addressBoundary.country}`,
          format: 'json',
          addressdetails: 1,
          dedupe: 1,
          limit: 5,
        },
      }).then(r => r.data);
      finalResponse = finalResponse.filter(r => r.address.street || r.address.road);
    }
  }

  if (filters.length > 0) {
    let filteredResponses = finalResponse.filter(object => filters.includes(object.type));
    if (filters.includes(OSM.ADMINISTRATIVE)
      || filters.includes(OSM.CITY)
      || filters.includes(OSM.TOWN)
      || filters.includes(OSM.HAMLET)) {
      filteredResponses = filteredResponses.filter(object =>
        object.address.city || object.address.town || object.address.hamlet);
    }
    return filteredResponses;
  }
  return finalResponse;
}
