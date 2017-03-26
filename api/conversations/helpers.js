import { NarrativeSession } from '../narratives/models';
import { MessageEntry } from './models';
import Clients from './clients';

export function makeBroadcast(broadcast, organization) {
  return new Promise((resolve, reject) => {
    NarrativeSession.where({ organization_id: organization.id })
      .fetchAll({ withRelated: ['constituent'] }).then((citySessions) => {
        citySessions.toJSON().forEach((session) => {
          if (session.constituent.facebook_id) {
            new Clients.FacebookMessengerClient({
              constituent: session.constituent,
            }).send(broadcast.message)
              .then(() => resolve())
              .catch(err => reject(err));
          } else if (session.constituent.phone) {
            new Clients.TwilioSMSClient({
              constituent: session.constituent,
            }).send(broadcast.message)
              .then(() => resolve())
              .catch(err => reject(err));
          }
        });
      }).catch(err => reject(err));
  });
}

export function createEntry(entry, organization) {
  if (!entry.phone_number && !entry.facebook_entry_id) {
    throw new Error('Missing Entry ID');
  }
  if (entry.facebook_entry_id && !entry.access_token) {
    throw new Error('Missing Access Token');
  }
  return MessageEntry.forge({
    ...entry,
    organization_id: organization.id,
  }).save(null, { method: 'insert' })
    .then(res => res)
    .catch((err) => {
      throw new Error(err);
    });
}

export function deleteEntry(entry) {
  return MessageEntry.where({ id: entry.id }).destroy({ require: true })
    .then(res => res)
    .catch((err) => {
      throw new Error(err);
    });
}
