import { geocoder } from '../../services/geocoder';
import { logger } from '../../logger';
import { nlp } from '../../services/nlp';
import { entityValueIs } from '../helpers';
import SlackService from '../../services/slack';
import { createOrganization, getAdminOrganizationAtLocation } from '../../accounts/helpers';
import { saveLocation } from '../../knowledge-base/helpers';
import * as TAGS from '../../constants/nlp-tagging';

const i18n = function(key) {
  return {
    setup_ask_city: 'Ok! What\'s your CITY and STATE?',
    setup_invalid_location: 'Sorry, did you say a city or state? Can you tell me what CITY and STATE you\'re from?'
  }[key];
}

export default {

  reset_organization() {
    this.messagingClient.send(i18n('setup_ask_city'));
    return 'waiting_organization';
  },

  waiting_organization: {
    message() {
      /* Get input, process it, and get a geolocation */
      const input = this.snapshot.input.payload.text || this.snapshot.payload.payload;
      logger.info(`made it this far... ${input}`);
      return nlp.message(input, {}).then((nlpData) => {

        // If no location is recognized by NLP, request again.
        if (!Object.prototype.hasOwnProperty.call(nlpData.entities, 'location')) {
          this.messagingClient.send(i18n('setup_invalid_location'));
          return;
        }

        return geocoder.geocode(nlpData.entities.location[0].value).then((geoData) => {
          // If more than one location is matched with our geolocation look up, ask for detail
          const filteredGeoData = geoData.filter(location => location.city);

          if (filteredGeoData.length > 1) {
            const quickReplies = filteredGeoData.map((location) => {
              const formattedText = `${location.city}, ${location.administrativeLevels.level1short}`;
              return {
                content_type: 'text',
                title: formattedText,
                payload: formattedText,
              };
            });
            this.messagingClient.send(`Hmm, which ${nlpData.entities.location[0].value} are you?`, quickReplies);
            return;
          } else if (filteredGeoData.length === 0) {
            this.messagingClient.send('Hmm, I wasn\'t able to find anything. Can you try giving me a CITY and STATE again?');
            return;
          }

          /* Match with Organization */
          this.set('nlp', nlpData.entities);
          this.set('location', filteredGeoData[0]);

          const constituentLocation = this.get('location');
          return getAdminOrganizationAtLocation(constituentLocation, { returnJSON: true })
            .then((orgModel) => {
              if (orgModel) {
                this.set('organization', orgModel);
                if (!orgModel.activated) {
                  new SlackService({
                    username: 'Inactive City Requested',
                    icon: 'round_pushpin',
                  }).send(`>*City Requested*: ${orgModel.name}\n>*ID*: ${orgModel.id}`);
                }
                return 'waiting_organization_confirm';
              }
              return saveLocation(constituentLocation).then((locationModel) => {
                return createOrganization({
                  name: locationModel.get('city'),
                  category: 'public',
                  type: 'admin',
                  location_id: locationModel.get('id'),
                }, { returnJSON: true }).then((orgJSON) => {
                  this.set('organization', orgJSON);

                  new SlackService({
                    username: 'Unregistered City',
                    icon: 'round_pushpin',
                  }).send(`>*City Requested*: ${orgJSON.name}\n>*ID*: ${orgJSON.id}`);

                  return 'waiting_organization_confirm';
                });
              });
            });
        });
      });
    },
  },


  waiting_organization_confirm: {
    enter() {
      var organization = this.get('organization');
      if (organization) {
        const quickReplies = [
          { content_type: 'text', title: 'Yep!', payload: 'Yep!' },
          { content_type: 'text', title: 'No', payload: 'No' },
        ];
        this.messagingClient.send(`Oh, ${organization.location.city}, ${organization.location.administrativeLevels.level1short}? Is that the right city?`, quickReplies);
      }
    },

    message() {
      const input = this.snapshot.input.payload.text || this.snapshot.payload.payload;
      return nlp.message(input, {}).then((nlpData) => {
        const entities = nlpData.entities;
        if (entityValueIs(entities[TAGS.CONFIRM_DENY], TAGS.YES)) {
          return 'smallTalk.askOptions';
        } else if (entityValueIs(entities[TAGS.CONFIRM_DENY], TAGS.NO)) {
          this.messagingClient.send('Oh! Can you tell me your CITY and STATE again?');
          return 'waiting_organization';
        }
        this.messagingClient.send('Sorry, I didn\'t catch whether that was correct.');
      });
    },
  },

};
