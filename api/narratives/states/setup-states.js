import { logger } from '../../logger';
import { nlp } from '../../services/nlp';
import { geocoder } from '../../services/geocoder';
import SlackService from '../../services/slack';
import { createOrganization, getAdminOrganizationAtLocation } from '../../accounts/helpers';
import { saveLocation } from '../../knowledge-base/helpers';

export const states = {

  setOrganization(aux) {
    logger.info('State: Set Organization');
    // If menu action, simply pose question
    if (aux && aux.freshStart) {
      this.messagingClient.send('Ok! Tell me the city name or postcode.');
      this.exit('setOrganization');
      return;
    }
    //
    // Get input, process it, and get a geolocation
    //
    const input = this.get('input').payload.text || this.get('input').payload.payload;
    nlp.message(input, {}).then((nlpData) => {
      // If no location is recognized by NLP, request again
      if (!Object.prototype.hasOwnProperty.call(nlpData.entities, 'location')) {
        this.messagingClient.send('Sorry, did you say a city or state? Can you tell me what city, state, and zipcode you\'re from?');
        this.exit('setOrganization');
      }
      geocoder.geocode(nlpData.entities.location[0].value).then((geoData) => {
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
          this.messagingClient.send(`Hmm, which ${nlpData.entities.location[0].value} are you?`, null, quickReplies);
          this.exit('setOrganization');
          return;
        } else if (filteredGeoData.length === 0) {
          this.messagingClient.send('Hmm, I can\'t find that city, can you try again?');
          this.exit('setOrganization');
          return;
        }
        //
        // Match with Organization
        //
        this.set('nlp', nlpData.entities);
        this.set('location', filteredGeoData[0]);
        const constituentLocation = this.get('location');

        getAdminOrganizationAtLocation(constituentLocation, { returnJSON: true })
          .then((orgModel) => {
            if (orgModel) {
              this.set('organization', orgModel);
              if (!orgModel.activated) {
                new SlackService({
                  username: 'Inactive City Requested',
                  icon: 'round_pushpin',
                }).send(`>*City Requested*: ${orgModel.name}\n>*ID*: ${orgModel.id}`);
              }
              this.fire('setOrganizationConfirm', null, { locationText: `${orgModel.location.city}, ${orgModel.location.administrativeLevels.level1short}` });
            } else {
              saveLocation(constituentLocation).then((locationModel) => {
                createOrganization({
                  name: locationModel.get('city'),
                  category: 'public',
                  type: 'admin',
                  location_id: locationModel.get('id'),
                }).then((orgModel) => {
                  this.set('organization', orgModel);
                  new SlackService({
                    username: 'Unregistered City',
                    icon: 'round_pushpin',
                  }).send(`>*City Requested*: ${orgModel.get('name')}\n>*ID*: ${orgModel.get('id')}`);
                  this.fire('setOrganizationConfirm', null, { locationText: `${locationModel.get('city')}, ${locationModel.get('administrativeLevels').level1short}` });
                });
              });
            }
          }).catch(logger.error);
      }).catch(logger.error);
    }).catch(logger.error);
  },

  setOrganizationConfirm(aux) {
    logger.info('State: Set Organization Confirmation');
    if (aux) {
      const quickReplies = [
        { content_type: 'text', title: 'Yep!', payload: 'Yep!' },
        { content_type: 'text', title: 'No', payload: 'No' },
      ];
      this.messagingClient.send(`Oh, ${aux.locationText}? Is that the right city?`, null, quickReplies);
      this.exit('setOrganizationConfirm');
    } else {
      const input = this.get('input').payload.text || this.get('input').payload.payload;
      nlp.message(input, {}).then((nlpData) => {
        if (nlpData.entities.confirm_deny[0].value === 'Yes') {
          this.messagingClient.addToQuene('Oh yeah? Some of the best mayors are around there. Including me of course.');
          // If city is activated, suggest asking a question or complaint
          // If not, tell them they can only leave complaints/suggestions!
          const quickReplies = [
            { content_type: 'text', title: 'What can I ask?', payload: 'WHAT_CAN_I_ASK' },
          ];
          if (this.get('organization').activated) {
            this.messagingClient.addToQuene('It looks like they\'ve given me answers to some questions and requests.', null, quickReplies);
          } else {
            this.messagingClient.addToQuene('You\'re community hasn\'t yet given me answers to any questions yet, but I\'ve let them know.', null, quickReplies);
          }
          this.messagingClient.runQuene().then(() => {
            this.exit('start');
          });
        } else if (nlpData.entities.confirm_deny[0].value === 'No') {
          this.messagingClient.send('Oh! Can you tell me your city and state again?');
          this.exit('setOrganization');
        } else {
          this.messagingClient.send('Sorry, I didn\'t catch whether that was correct.');
          this.exit('setOrganizationConfirm');
        }
      });
    }
  },

};
