import geocoder from '../../services/geocoder';
import { logger } from '../../logger';
import { nlp } from '../../services/nlp';
import * as TAGS from '../../constants/nlp-tagging';
import SlackService from '../../services/slack';
import { getGovernmentOrganizationAtLocation } from '../../accounts/helpers';
import { i18n } from '../templates/messages';

export default {
  reset_organization() {
    this.messagingClient.send(i18n('setup_ask_city'));
    return 'waiting_organization';
  },

  waiting_organization: {
    message() {
      /* Get input, process it, and get a geolocation */
      const input = this.snapshot.input.payload.text || this.snapshot.input.payload.payload;
      return geocoder(input).then((data) => {
        logger.info(data);
        const validResults = data.filter((result) => {
          return ['administrative', 'city', 'town', 'neighbourhood', 'hamlet', 'village'].includes(result.type) && (result.address.city || result.address.town || result.address.hamlet);
        });

        logger.info(validResults);

        // If more than one location is matched with our geolocation look up, ask for detail
        if (validResults.length > 1) {
          const quickReplies = validResults.map((location) => {
            const text = `${location.address.city || location.address.town || location.address.hamlet}, ${location.address.county.replace(/([A-Z])/g, ' $1').trim()}, ${location.address.state} ${location.address.postcode || ''}`;
            return {
              content_type: 'text',
              title: text,
              payload: text,
            };
          });

          this.messagingClient.send(`Which ${input} are you?`, quickReplies);
          return;
        } else if (validResults.length === 0) {
          this.messagingClient.send(i18n('setup_invalid_location'));
          return;
        }

        const location = validResults[0];

        this.set('location', location);

        // If the session is with a provider org, don't change
        if (this.get('organization') === 'government') {
          return getGovernmentOrganizationAtLocation(location, { returnJSON: true })
            .then((orgModel) => {
              if (orgModel) {
                this.set('organization', orgModel);
              } else {
                this.set('organization', null);
              }
              return 'waiting_organization_confirm';
            });
        } else {
          return 'waiting_organization_confirm';
        }
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
      return nlp.message(this.snapshot.input.payload.text).then((nlpData) => {
        const entities = nlpData.entities;

        if (entities.intent && entities.intent[0]) {
          switch(entities.intent[0].value) {
            case 'speech.confirm':
              if (!this.get('organization')) {
                new SlackService({
                  username: 'New Town/City Set!',
                  icon: 'round_pushpin',
                }).send(`>*Location*: ${this.get('location').display_name}`);
              }
              return this.getBaseState('what_can_i_do');
            case 'speech.deny':
              this.messagingClient.send('Oh! Can you tell me your CITY and STATE again?');
              return 'waiting_organization';
          }
        }

        this.messagingClient.send('Sorry, I didn\'t catch whether that was correct.');
      });
    },
  },

  async default_location() {
    if (!this.snapshot.nlp || (this.snapshot.nlp.entities && !(this.snapshot.nlp.entities[TAGS.LOCATION] || this.snapshot.nlp.entities[TAGS.SEARCH_QUERY]))) {
      this.messagingClient.send('Sorry, I didn\'t catch an address. Did you mention a city and state?');
      return this.getBaseState();
    }
    // I hate this random string joining so much
    const formedString = `${this.snapshot.nlp.entities[TAGS.SEARCH_QUERY] ? this.snapshot.nlp.entities[TAGS.SEARCH_QUERY].map(l => l.value).join(' ') : ''}${this.snapshot.nlp.entities[TAGS.LOCATION] ? this.snapshot.nlp.entities[TAGS.LOCATION][0].value : ''}`;
    const geoData = await geocoder(formedString).then(gd => gd[0]);
    if (geoData) {
      this.set('attributes', {
        ...this.get('attributes'),
        default_location: geoData,
      });
      this.messagingClient.send(`Thanks! I've set your default location to ${this.get('attributes').default_location.display_name}`);
    } else {
      this.messagingClient.send('Sorry, I didn\'t catch an address. Can you say that again?');
    }
    return this.getBaseState();
  },
};
