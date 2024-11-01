import dotenv from 'dotenv';
import * as ENV_CONSTANTS from './constants/environments';

let environment;

function getArg(flag) {
  if (process.argv.indexOf(flag) > -1) {
    return process.argv[process.argv.indexOf(flag) + 1];
  }
  return undefined;
}

function getEnv() {
  let env;
  // Check Environment
  if (process.env.NODE_ENV) {
    env = process.env.NODE_ENV;
  // Check Command Line
  } else if (getArg('-env')) {
    env = getArg('-env');
  }
  // Pass Back
  if (ENV_CONSTANTS.ENVIRONMENTS.includes(env)) {
    return env;
  } else if (!env) {
    return ENV_CONSTANTS.LOCAL;
  }
  throw new Error('Unacceptable Environment Variable');
}

function set(env) {
  environment = env;
  if (env === 'local') {
    dotenv.config({ path: '.env.local' });
  } else if (env === 'production') {
    dotenv.config({ path: '.env.production' });
  } else if (env === 'test' && !process.env.CONTINUOUS_INTEGRATION) {
    dotenv.config({ path: '.env.test' });
  }
  process.env.ROOT = __dirname;
}

export function setup() {
  const env = getEnv();
  set(env);
}

export function get() {
  if (!process.env.NODE_ENVIRONMENT) {
    setup();
  }
  return environment;
}

export function getDashboardRoot() {
  if (!process.env.NODE_ENVIRONMENT) {
    setup();
  }
  if (process.env.NODE_ENVIRONMENT !== ENV_CONSTANTS.PRODUCTION) {
    return 'localhost:8000';
  }
  return 'https://dashboard.kit.community';
}
