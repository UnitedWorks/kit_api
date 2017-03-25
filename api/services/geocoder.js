import axios from 'axios';

export default function geocoder(input) {
  // http://nominatim.openstreetmap.org/search?q=Queens,%20New%20York&format=json&addressdetails=1&dedupe=1&type=administrative&polygon_geojson=1
  return axios.get('http://nominatim.openstreetmap.org/search', {
    params: {
      q: input,
      format: 'json',
      addressdetails: 1,
      dedupe: 1,
      // polygon_geojson: 1,
      limit: 5
    },
  }).then(response => response.data);
}
