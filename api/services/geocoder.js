import axios from 'axios';

export default function geocoder(input) {
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
