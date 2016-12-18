import { ENVIRONMENTS } from './constants/environments';

export const passed = (() => {
  let environment = 'production';
  // Check for environment passed in
  if (process.argv.indexOf('-env') > -1) {
    const env = process.argv[process.argv.indexOf('-env') + 1];
    if (ENVIRONMENTS.includes(env)) {
      environment = env;
    }
  }
  return environment;
})();
