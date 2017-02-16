import { NarrativeSession } from '../narratives/models';
import Clients from './clients';

export function makeBroadcast(broadcast, organization, options) {
  return new Promise((resolve, reject) => {
    NarrativeSession.where({ organization_id: organization.id })
      .fetchAll({ withRelated: ['constituent'] }).then((citySessions) => {
        citySessions.toJSON().forEach((session) => {
          if (session.constituent.facebook_id) {
            new Clients.FacebookMessengerClient({
              constituent: session.constituent,
            }).send(broadcast.message);
          } else if (session.constituent.phone) {
            new Clients.TwilioSMSClient({
              constituent: session.constituent,
            }).send(broadcast.message);
          }
        });
        resolve();
      });
  });
}
