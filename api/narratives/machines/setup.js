import geocoder from '../../services/geocoder';
import { logger } from '../../logger';
import { nlp } from '../../services/nlp';
import * as TAGS from '../../constants/nlp-tagging';
import SlackService from '../../services/slack';
import { getGovernmentOrganizationAtLocation } from '../../accounts/helpers';
import { i18n } from '../templates/messages';
import * as replyTemplates from '../templates/quick-replies';

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
        }
        return 'waiting_organization_confirm';
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
    const nlpEntities = this.snapshot.nlp ? this.snapshot.nlp.entities : await nlp.message(this.snapshot.input.payload.text).then(n => n.entities);
    // They want to bounce
    if (nlpEntities.intent && nlpEntities.intent[0].value === 'speech.escape') {
      this.messagingClient.send('Ok!', replyTemplates.whatCanIAsk);
      return this.getBaseState();
    }
    // Go through with Setting Location
    const formedString = nlpEntities[TAGS.LOCATION] ? nlpEntities[TAGS.LOCATION][0].value : this.snapshot.input.payload.text;
    const geoData = await geocoder(formedString, [], this.get('organization').location.address).then(gd => gd[0]);
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
