import axios from 'axios';
import { Constituent } from '../accounts/models';
import { NarrativeSession } from '../narratives/models';
import { MessageEntry } from './models';
import { geoCheck } from '../narratives/helpers';
import Clients from './clients';
import { i18n } from '../narratives/templates/messages';

export function getPreferredClient(constituent) {
  if (constituent.facebook_id) {
    return new Clients.FacebookMessengerClient({ constituent });
  } else if (constituent.phone) {
    return new Clients.TwilioSMSClient({ constituent });
  }
  return null;
}

export async function broadcastMessage(broadcast, organization) {
  const sessions = await NarrativeSession.where({ organization_id: organization.id })
    .fetchAll({ withRelated: ['constituent', 'constituent.facebookEntry', 'constituent.smsEntry'] })
    .then(fetched => fetched.toJSON());
  sessions.forEach((session) => {
    const client = getPreferredClient(session.constituent);
    if (!client) return;
    // If availiability polygon exists, run check
    if (broadcast.availability && broadcast.availability.geo) {
      // Check for default address. If none exists, ask to set
      if (!session.data_store.attributes || (session.data_store.attributes && !session.data_store.attributes.default_location)) {
        client.send(i18n('get_default_location'));
      } else {
        const constituentPosition = session.data_store.attributes.default_location;
        const constituentIncluded = geoCheck(broadcast.availability.geo,
          [constituentPosition.lat, constituentPosition.lon]);
        if (constituentIncluded) client.send(broadcast.message);
      }
    } else {
      client.send(broadcast.message);
    }
  });
}

export function broadcastHelper(broadcast, organization) {
  if (broadcast.message) {
    return broadcastMessage(broadcast, organization);
  }
  throw new Error('Unable to broadcast');
}

export async function messageConstituent(constituentId, message, quickReplies) {
  const con = await Constituent.where({ id: constituentId }).fetch({ withRelated: ['facebookEntry', 'smsEntry'] }).then(c => c.toJSON());
  const client = getPreferredClient(con);
  if (client) client.send(message, quickReplies);
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
