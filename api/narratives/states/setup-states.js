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
    setup_ask_city: 'Ok! Tell me the city name or postcode.',
    setup_invalid_location: 'Sorry, did you say a city or state? Can you tell me what city, state, and zipcode you\'re from?'
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
            this.messagingClient.send('Hmm, I can\'t find that city, can you try again?');
            return;
          }

          /* Match with Organization */
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
          this.messagingClient.addToQuene('Oh yeah? Some of the best mayors are around there. Including me of course.');
          // If city is activated, suggest asking a question or complaint
          // If not, tell them they can only leave complaints/suggestions!
          const quickReplies = [
            { content_type: 'text', title: 'Upcoming Election', payload: 'Upcoming Election' },
            { content_type: 'text', title: 'Available Benefits', payload: 'Available Benefits' },
            { content_type: 'text', title: 'Raise an Issue', payload: 'MAKE_REQUEST' },
            { content_type: 'text', title: 'What can I ask?', payload: 'WHAT_CAN_I_ASK' },
          ];
          if (this.get('organization').activated) {
            this.messagingClient.addToQuene('It looks like they\'ve given me answers to some questions and requests.', quickReplies);
          } else {
            this.messagingClient.addToQuene('Your community hasn\'t yet given me answers to any questions yet, but I\'ve let them know.', quickReplies);
          }
          return this.messagingClient.runQuene().then(() => {
            return 'smallTalk.start';
          });
        } else if (entityValueIs(entities[TAGS.CONFIRM_DENY], TAGS.NO)) {
          this.messagingClient.send('Oh! Can you tell me your city and state again?');
          return 'waiting_organization';
        }
        this.messagingClient.send('Sorry, I didn\'t catch whether that was correct.');
      });
    },
  },

};
