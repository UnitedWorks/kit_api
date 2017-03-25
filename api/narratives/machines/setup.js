import geocoder from '../../services/geocoder';
import { logger } from '../../logger';
import { nlp } from '../../services/nlp';
import { entityValueIs } from '../helpers';
import SlackService from '../../services/slack';
import { getAdminOrganizationAtLocation } from '../../accounts/helpers';
import * as TAGS from '../../constants/nlp-tagging';

const i18n = function(key) {
  return {
    setup_ask_city: 'Ok! What\'s your CITY and STATE?  Ex) "New Brunswick, NJ"',
    setup_invalid_location: 'Hmm, I wasn\'t able to find anything. Can you try giving me a CITY and STATE again? Ex) "New Brunswick, NJ"'
  }[key];
}

const admin_levels = {
  country: 2,
  state: 4,
  state_district: 5,
  county: 7,
  village: 8,
  city_district: 9,
  suburb: 10,
};

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
      // http://nominatim.openstreetmap.org/search?q=Queens,%20New%20York&format=json&addressdetails=1&dedupe=1&type=administrative&polygon_geojson=1

      return geocoder(input).then((data) => {
        logger.info(data);
        const valid_results = data.filter((result)=>{
          return ["administrative", "city", "town", "neighbourhood", "hamlet", "village"].includes(result.type) && (result.address.city || result.address.town);
        });

        logger.info(valid_results);

        // If more than one location is matched with our geolocation look up, ask for detail
        if (valid_results.length > 1) {
          const quickReplies = valid_results.map((location) => {
            const text = `${location.address.city || location.address.town}, ${location.address.state}`;
            return {
              content_type: 'text',
              title: text,
              payload: text,
            };
          });

          this.messagingClient.send(`Which ${input} are you?`, quickReplies);
          return;
        } else if (valid_results.length === 0) {
          this.messagingClient.send(i18n('setup_invalid_location'));
          return;
        }

        const location = valid_results[0];

        this.set('location', location);

        return getAdminOrganizationAtLocation(location, { returnJSON: true })
          .then((orgModel) => {
            if (orgModel) {
              this.set('organization', orgModel);
            }
            return 'waiting_organization_confirm';
          });
      });
    },
  },


  waiting_organization_confirm: {
    enter() {
      const location = this.get('location');
      if (location) {
        const quickReplies = [
          { content_type: 'text', title: 'Yep!', payload: 'Yep!' },
          { content_type: 'text', title: 'No', payload: 'No' },
        ];
        this.messagingClient.send(`${location.display_name}? Is that right?`, quickReplies);
      }
    },

    message() {
      const input = this.snapshot.input.payload.text || this.snapshot.payload.payload;
      return nlp.message(input, {}).then((nlpData) => {
        const entities = nlpData.entities;
        if (entityValueIs(entities[TAGS.CONFIRM_DENY], TAGS.YES)) {
          if (!this.get('organization')) {
            new SlackService({
              username: 'Unregistered Town/City Requested!',
              icon: 'round_pushpin',
            }).send(`>*Location*: ${this.get('location').display_name}`);
          }
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
