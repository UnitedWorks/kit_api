import * as interfaces from '../constants/interfaces'
import * as environments from '../constants/environments'

export function isDefined(obj) {
  if (typeof obj == 'undefined') {
    return false;
  }
  if (!obj) {
    return false;
  }
  return obj != null;
}

export function getPlacesUrl(addressString) {
  const formattedString = addressString.replace(/\s/, '+');
  return `https://www.google.com/maps/place/${formattedString}`;
}

export function getOrigin(origin) {
  if (/chrome/.test(origin) || /localhost/.test(origin)) {
    return environments.LOCAL;
  } else if (/kit.community/.test(origin)) {
    return environments.PRODUCTION;
  }
  return interfaces.FACEBOOK;
}
