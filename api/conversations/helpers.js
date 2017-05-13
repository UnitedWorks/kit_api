import axios from 'axios';
import { NarrativeSession } from '../narratives/models';
import { MessageEntry } from './models';
import Clients from './clients';

export function broadcastMessage(broadcast, organization) {
  return NarrativeSession.where({ organization_id: organization.id })
    .fetchAll({ withRelated: ['constituent', 'constituent.facebookEntry', 'constituent.smsEntry'] }).then((citySessions) => {
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
    }).catch(err => err);
}

export function createEntry(entry, organization, options = {}) {
  if (!entry.phone_number && !entry.facebook_entry_id) {
    throw new Error('Missing Entry ID');
  }
  if (entry.facebook_entry_id && !entry.access_token) {
    throw new Error('Missing Access Token');
  }
  // Exchange short-term access token for long-term access token
  return axios.get('https://graph.facebook.com/v2.8/oauth/access_token', {
    params: {
      grant_type: 'fb_exchange_token',
      client_id: process.env.FB_APP_ID,
      client_secret: process.env.FB_APP_SECRET,
      fb_exchange_token: entry.access_token,
    },
  }).then((longTermTokenResponse) => {
    const refreshedEntry = entry;
    refreshedEntry.access_token = longTermTokenResponse.data.access_token;
    // Save new token and entry page information
    return MessageEntry.forge({
      ...refreshedEntry,
      starting_action_enabled: true,
      organization_id: organization.id,
    }).save(null, { method: 'insert' }).then((entryModel) => {
      // Have the app listen to the page, forwarding along messages to our webhook
      return axios.post(`https://graph.facebook.com/v2.8/${refreshedEntry.facebook_entry_id}/subscribed_apps?access_token=${refreshedEntry.access_token}`)
        .then((response) => {
          // Enable the Getting Started Button
          Clients.FacebookMessengerClient.configureStartingButton(
            refreshedEntry.access_token, entry.starting_action_enabled)
          // And respond to the original request!
          if (response.error) throw new Error(response.error.message);
          return options.returnJSON ? entryModel.toJSON() : entryModel;
        }).catch((error) => {
          throw new Error(error);
        });
    }).catch((err) => {
      throw new Error(err);
    });
  }).catch((err) => {
    throw new Error(err);
  });
}

export function updateEntry(entry, options = {}) {
  return MessageEntry.where({ id: entry.id }).fetch().then((fetchedEntry) => {
    const updateRequests = [fetchedEntry.save(entry)];
    if (entry.facebook_entry_id) {
      if (entry.persistent_menu_enabled !== fetchedEntry.get('persistent_menu_enabled')) {
        updateRequests.push(Clients.FacebookMessengerClient.configurePersistentMenu(
          fetchedEntry.get('access_token'), entry.persistent_menu_enabled));
      }
      if (entry.starting_action_enabled !== fetchedEntry.get('starting_action_enabled')) {
        updateRequests.push(Clients.FacebookMessengerClient.configureStartingButton(
          fetchedEntry.get('access_token'), entry.starting_action_enabled));
      }
    }
    return Promise.all(updateRequests).then(() => {
      return options.returnJSON ? fetchedEntry.toJSON() : fetchedEntry;
    }).catch((err) => {
      throw new Error(err);
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
