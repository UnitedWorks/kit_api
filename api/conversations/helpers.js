import axios from 'axios';
import { NarrativeSession } from '../narratives/models';
import { MessageEntry } from './models';
import Clients from './clients';

export function makeBroadcast(broadcast, organization) {
  return new Promise((resolve, reject) => {
    NarrativeSession.where({ organization_id: organization.id })
      .fetchAll({ withRelated: ['constituent', 'constituent.facebookEntry'] }).then((citySessions) => {
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

export function createEntry(entry, organization, options = {}) {
  if (!entry.phone_number && !entry.facebook_entry_id) {
    throw new Error('Missing Entry ID');
  }
  if (entry.facebook_entry_id && !entry.access_token) {
    throw new Error('Missing Access Token');
  }
  return MessageEntry.forge({
    ...entry,
    organization_id: organization.id,
  }).save(null, { method: 'insert' }).then((entryModel) => {
    return axios.post(`https://graph.facebook.com/v2.8/${entry.facebook_entry_id}/subscribed_apps?access_token=${entry.access_token}`)
      .then((response) => {
        if (response.error) throw new Error(response.error.message);
        return options.returnJSON ? entryModel.toJSON() : entryModel;
      }).catch((error) => {
        throw new Error(error);
      });
  }).catch((err) => {
    throw new Error(err);
  });
}

export function deleteEntry(entry) {
  return MessageEntry.where({ id: entry.id }).fetch().then((entryModel) => {
    return axios.delete(`https://graph.facebook.com/v2.8/${entryModel.toJSON().facebook_entry_id}/subscribed_apps?access_token=${entryModel.toJSON().access_token}`)
      .then((response) => {
        if (response.error) throw new Error(response.error.message);
        return entryModel.destroy().then(() => {
          return { id: entry.id };
        }).catch((err) => {
          throw new Error(err);
        });
      }).catch((err) => {
        throw new Error(err);
      });
  }).catch((err) => {
    throw new Error(err);
  });
}
