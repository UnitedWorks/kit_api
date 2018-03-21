import axios from 'axios';
import geolib from 'geolib';

export default class Stae {
  constructor(props) {
    this.municipalId = props.municipality_id;
    this.apiUrl = `https://municipal.systems/v1/municipalities/${this.municipalId}`;
  }
  getBikeShareStations(options = { sortFromPoint: null }) {
    return axios.get(`${this.apiUrl}/dataTypes/transit-station/data?filters[data][type]=bicycle`, {
      headers: { 'Cache-Control': 'no-cache' },
    }).then((res) => {
      if (!options.sortFromPoint || options.sortFromPoint.length !== 2) return res.data.results;
      const results = res.data.results.sort((a, b) => {
        return geolib.getDistance({
          latitude: a.geometry.coordinates[1],
          longitude: a.geometry.coordinates[0],
        }, {
          latitude: options.sortFromPoint[0],
          longitude: options.sortFromPoint[1],
        }) - geolib.getDistance({
          latitude: b.geometry.coordinates[1],
          longitude: b.geometry.coordinates[0],
        }, {
          latitude: options.sortFromPoint[0],
          longitude: options.sortFromPoint[1],
        });
      }).map((station) => {
        const metersAway = geolib.getDistance({
          latitude: station.geometry.coordinates[1],
          longitude: station.geometry.coordinates[0],
        }, {
          latitude: options.sortFromPoint[0],
          longitude: options.sortFromPoint[1],
        });
        const milesAway = Number(metersAway * 0.000621371).toFixed(1);
        return {
          type: 'place',
          payload: {
            name: `${station.data.operators[0] ? station.data.operators[0].slice(0, 1).toUpperCase() : ''}${station.data.operators[0] ? station.data.operators[0].slice(1) : ''} ${station.data.name}`,
            description: `Bike share station with ${station.data.capacity} bicycles located ${milesAway} miles away. Operated by ${station.data.operators[0].slice(0, 1).toUpperCase()}${station.data.operators[0].slice(1)}.`,
            location: {
              type: 'Point',
              coordinates: [
                station.data.location.coordinates[1],
                station.data.location.coordinates[0],
              ],
            },
          },
        };
      });
      return results.slice(0, 3);
    }).catch(e => e);
  }
}
