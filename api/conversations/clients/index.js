import BaseClient from './base-client';
import * as Messenger from './facebook-messenger-client';
import * as Twilio from './twilio-client';

const configureExternalInterfaces = () => {
  Messenger.configureExternalInterfaces();
};

module.exports = {
  BaseClient,
  FacebookMessengerClient: Messenger.FacebookMessengerClient,
  TwilioSMSClient: Twilio.TwilioSMSClient,
  configureExternalInterfaces,
};
