import axios from 'axios';

export function restructureGoogleResult(gAdd) {
  // Pick out Address Components
  const unitNumber = gAdd.address_components.filter(a => a.types.indexOf('subpremise') >= 0);
  const streetNumber = gAdd.address_components.filter(a => a.types.indexOf('street_number') >= 0);
  const streetName = gAdd.address_components.filter(a => a.types.indexOf('route') >= 0);
  const city = gAdd.address_components.filter(a => a.types.indexOf('locality') >= 0);
  const region = gAdd.address_components.filter(a => a.types.indexOf('administrative_area_level_2') >= 0);
  const state = gAdd.address_components.filter(a => a.types.indexOf('administrative_area_level_1') >= 0);
  const postalCode = gAdd.address_components.filter(a => a.types.indexOf('postal_code') >= 0);
  const country = gAdd.address_components.filter(a => a.types.indexOf('country') >= 0);
  // Form Address Record
  const addressObj = {
    name: gAdd.formatted_address,
    location: {
      coordinates: [gAdd.geometry.location.lat, gAdd.geometry.location.lng],
    },
    address_1: `${unitNumber.length > 0 ? unitNumber[0].long_name : ''} ${streetNumber.length > 0 ? streetNumber[0].long_name : ''} ${streetName.length > 0 ? streetName[0].long_name : ''}`.trim(),
    city: city.length > 0 ? city[0].long_name : null,
    region: region.length > 0 ? region[0].long_name : null,
    state: state.length > 0 ? state[0].long_name.toUpperCase() : null,
    postal_code: postalCode.length > 0 ? postalCode[0].long_name : null,
    country: country.length > 0 ? country[0].long_name : null,
    country_code: country.length > 0 ? country[0].short_name.toUpperCase() : null,
  };
  if (addressObj.address_1.length === 0) addressObj.address_1 = null;
  return addressObj;
}

export async function geocoder(input, addressBoundary) {
  let finalResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
    params: { address: input, key: process.env.GEOCODE_KEY },
  }).then(r => r.data.results.map(d => restructureGoogleResult(d)));
  // If addressBoundary is passed in, we need a matching state/country
  if (addressBoundary) {
    const passingLocations = finalResponse.filter(loc =>
      loc && loc.region && loc.state && loc.country_code
      && (loc.region || '').toUpperCase() === (addressBoundary.region || '').toUpperCase()
      && (loc.state || '').toUpperCase() === (addressBoundary.state || '').toUpperCase()
      && (loc.country_code || '').toUpperCase() === (addressBoundary.country_code || '').toUpperCase()
      && (loc.city || '').toUpperCase() === (addressBoundary.city || '').toUpperCase());
    if (passingLocations.length === 0) {
      finalResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: { address: `${input} ${addressBoundary.city} ${addressBoundary.state}`, key: process.env.GEOCODE_KEY },
      }).then(r => r.data.results.map(d => restructureGoogleResult(d)));
      finalResponse = finalResponse.filter(loc =>
        loc && loc.region && loc.state && loc.country_code
        && (loc.region || '').toUpperCase() === (addressBoundary.region || '').toUpperCase()
        && (loc.state || '').toUpperCase() === (addressBoundary.state || '').toUpperCase()
        && (loc.country_code || '').toUpperCase() === (addressBoundary.country_code || '').toUpperCase()
        && (loc.city || '').toUpperCase() === (addressBoundary.city || '').toUpperCase());
    } else if (passingLocations.length === 1) {
      finalResponse = [passingLocations[0]];
    } else {
      finalResponse = [];
    }
  }
  return finalResponse.length > 0 ? finalResponse[0] : null;
}

export async function reverseGeocoder(coords) {
  const finalResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
    params: { latlng: `${coords.lat},${coords.lon}`, key: process.env.GEOCODE_KEY },
  }).then(r => r.data.results.map(d => restructureGoogleResult(d)));
  return finalResponse[0];
}

export default geocoder;
