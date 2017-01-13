import BaseClient from './base-client';
import * as Messenger from './facebook-messenger-client';

const configureExternalInterfaces = () => {
  Messenger.configureExternalInterfaces();
};

module.exports = {
  BaseClient,
  FacebookMessengerClient: Messenger.FacebookMessengerClient,
  configureExternalInterfaces,
};
