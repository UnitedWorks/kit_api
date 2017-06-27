import { Wit } from 'node-wit';
import { logger } from '../logger';
import geocoder from './geocoder';

export const WitInstance = new Wit({
  accessToken: process.env.WIT_ACCESS_TOKEN,
  actions: {
    send(request, response) {
      const { sessionId, context, entities } = request;
      const { text, quickreplies } = response;
      return new Promise((resolve, reject) => {
        logger.info(JSON.stringify(response));
        return resolve();
      });
    },
  },
});

export const nlp = {
  message(text, config = {}) {
    return WitInstance.message(text, config).then((nlpData) => {
      if (nlpData.entities && nlpData.entities.intent) {
        nlpData.entities.intent = nlpData.entities.intent.filter(i => !i.suggested);
      }
      if (nlpData.entities && nlpData.entities.category_keywords) {
        nlpData.entities.category_keywords = nlpData.entities.category_keywords.filter(i => !i.suggested);
      }
      return nlpData;
    });
  },
};

export const messageToGeodata = (input, userLocation) => {
  // Get Text
  return nlp.message(input).then((nlpData) => {
    if (!nlpData.entities.location) return null;
    const locationString = nlpData.entities.location[0].value;
    // Get GeoLocation
    return geocoder(locationString).then((geoData) => {
      const geoSuggestion = geoData.length ? geoData[0] : {};
      // If our geodata isn't in the same city, get more specifics
      if (userLocation && geoSuggestion.address.city !== userLocation.address.city) {
        logger.info(`Require more specific location. Join user locaiton to provided address = ${locationString}, ${userLocation.address.city} ${userLocation.address.country}`);
        return geocoder(`${locationString}, ${userLocation.address.city} ${userLocation.address.country}`)
          .then(refinedGeoData => refinedGeoData[0]);
      }
      return geoSuggestion;
    });
  });
};
