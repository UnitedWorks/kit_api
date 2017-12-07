import * as interfaces from '../constants/interfaces'
import * as environments from '../constants/environments'
import { logger } from '../logger';

export function isDefined(obj) {
  if (typeof obj == 'undefined') {
    return false;
  }
  if (!obj) {
    return false;
  }
  return obj != null;
}

export function getOrigin(origin) {
  if (/chrome/.test(origin) || /localhost/.test(origin)) {
    return environments.LOCAL;
  } else if (/kit.community/.test(origin)) {
    return environments.PRODUCTION;
  }
  return interfaces.FACEBOOK;
}

export function baseErrorHandler(err, req, res, next) {
  logger.error(err);
  res.status(500);
  if (typeof err === 'string') {
    res.send({
      error: {
        status: 500,
        message: err,
        type: 'internal',
      },
    });
  } else if (typeof err === 'object' && err.message) {
    res.send({
      error: {
        status: err.status || 500,
        message: err.message,
        type: err.type || 'internal',
      },
    });
  } else {
    res.send({
      error: {
        status: 500,
        message: 'Unknown error occurred.',
      },
    });
  }
}

export function shuffle(a) {
  for (let i = a.length; i; i -= 1) {
    const j = Math.floor(Math.random() * i);
    [a[i - 1], a[j]] = [a[j], a[i - 1]];
  }
  return a;
}
