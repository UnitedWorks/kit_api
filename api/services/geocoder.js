import NodeGeocoder from 'node-geocoder';

const options = {
  provider: process.env.GEOCODE_PROVIDER,
  httpAdapter: 'https',
  apiKey: process.env.GEOCODE_KEY,
  formatter: null,
};

export const geocoder = NodeGeocoder(options);
