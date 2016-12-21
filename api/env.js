import dotenv from 'dotenv';
import { ENVIRONMENTS } from './constants/environments';

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
  if (process.env.NODE_ENVIRONMENT) {
    env = process.env.NODE_ENVIRONMENT;
  // Check Command Line
  } else if (getArg('-env')) {
    env = getArg('-env');
  }
  // Pass Back
  if (ENVIRONMENTS.includes(env)) {
    return env;
  } else if (!env) {
    throw 'No Environment Variable Found';
  } else {
    throw 'Unacceptable Environment Variable';
  }
}

function set(env) {
  environment = env;
  if (env === 'local') {
    dotenv.config({ path: '.env.local' });
  } else if (env === 'production') {
    dotenv.config({ path: '.env.production' });
  } else if (env === 'test') {
    dotenv.config({ path: '.env.test' });
  }
}

export function setup() {
  const env = getEnv();
  set(env);
}

export function get() {
  if (!process.env.ENVIRONMENT) {
    setup();
  }
  return environment;
}