import { Wit } from 'node-wit';
import { logger } from '../logger';
import { geocoder } from './geocoder';

export const nlp = new Wit({
  accessToken: process.env.WIT_ACCESS_TOKEN,
  actions: {
    send(request, response) {
      const {sessionId, context, entities} = request;
      const {text, quickreplies} = response;
      return new Promise((resolve, reject) => {
        logger.info(JSON.stringify(response));
        return resolve();
      });
    },
  },
});

export const messageToGeodata = (input, userLocation) => {
  // Get Text
  return nlp.message(input, {}).then((nlpData) => {
    if (!nlpData.entities.location) return null;
    const locationString = nlpData.entities.location[0].value;
    // Get GeoLocation
    return geocoder.geocode(locationString).then((geoData) => {
      const geoSuggestion = geoData.length ? geoData[0] : {};
      // If our geodata isn't in the same city, get more specifics
      if (geoSuggestion.city !== userLocation.city) {
        return geocoder.geocode(`${locationString}, ${userLocation.city} ${userLocation.country}`)
          .then(refinedGeoData => refinedGeoData[0]);
      }
      return geoSuggestion;
    });
  });
};
