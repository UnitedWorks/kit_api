import { logger } from '../../logger';
import { NarrativeStoreMachine } from './state';
import { nlp } from '../../services/nlp';
import { geocoder } from '../../services/geocoder';
import { Organization } from '../../accounts/models';
import * as TAGS from '../../constants/nlp-tagging';
import { getAnswers } from '../../knowledge-base/helpers';

const smallTalkStates = {
  init() {
  },

  gettingStarted() {
    logger.info('State: Getting Started');
    this.messagingClient.send(this.snapshot.constituent, 'Hey there! I\'m the Mayor').then(() => {
      this.messagingClient.send(this.snapshot.constituent, 'Sort of... Truthfully, I\'m an AI bot that helps you connect with the city and your community').then(() => {
        this.messagingClient.send(this.snapshot.constituent, 'I can tell you the trash schedule, report potholes, or try and help with any problems or injustices you\'re facing.').then(() => {
          this.fire('location', null, { previous: 'gettingStarted' });
        });
      });
    });
  },

  location(aux = {}) {
    logger.info('State: Location');
    const input = this.get('input').payload;
    if (aux.hasOwnProperty('previous')) {
      switch (aux.previous) {
        case 'gettingStarted':
          this.messagingClient.send(this.snapshot.constituent, 'But before I can help out, what city and state do you live in?');
          this.exit('location');
          break;
        default:
          this.messagingClient.send(this.snapshot.constituent, 'Which city do you want to connect to and get info from?');
          this.exit('location');
          break;
      }
    } else {
      nlp.message(input.text, {}).then((nlpData) => {
        geocoder.geocode(nlpData.entities.location[0].value).then((geoData) => {
          this.set('nlp', nlpData.entities);
          this.set('location', geoData[Object.keys(geoData)[0]]);
          const numberOfLocations = Object.keys(geoData).length;
          if (numberOfLocations > 1) {
            const message = `Did you mean ${geoData['0'].formattedAddress}? If not, give a bit more detail.`;
            this.messagingClient.send(this.snapshot.constituent, message);
            this.exit('location');
          } else if (numberOfLocations === 1) {
            this.set('location', geoData[0]);
            this.fire('setOrganization');
          } else {
            const message = this.previous !== 'location' ? 'What city are you located in?' : 'Hmm, I`m not familiar with that city. I might need a state or zipcode.';
            this.messagingClient.send(this.snapshot.constituent, message);
            this.exit('location');
          }
        }).catch(logger.info);
      }).catch(logger.info);
    }
  },

  setOrganization() {
    logger.info('State: Set Organization');
    // When a geolocation is found for the user, see if a matching city is found for an organization
    // I think this function should be improved to require administrative level matching
    const constituentLocation = this.get('location');
    Organization.collection().fetch({ withRelated: 'location' }).then((collection) => {
      let cityFound = false;
      collection.toJSON().forEach((document) => {
        if (document.location.city === constituentLocation.city) {
          this.set('organization', document);
          const message = `Got it! I'll make sure my answers relate to ${constituentLocation.city}. Where were we?`;
          this.messagingClient.send(this.snapshot.constituent, message);
          this.exit('start');
          cityFound = true;
        }
      });
      if (!cityFound) {
        this.messagingClient.send(this.snapshot.constituent, 'Oh no! Your city isn\'t registered. I will let them know you\'re interested.');
        this.exit('start');
      }
    });
  },

  start() {
    logger.info('State: Start');
    const input = this.get('input').payload;
    nlp.message(input.text, {}).then((nlpData) => {
      this.set('nlp', nlpData.entities);
      const entities = nlpData.entities;
      logger.info(nlpData);
      // What services does my city offer?
      if (entities.hasOwnProperty(TAGS.SANITATION)) {
        const value = entities[TAGS.SANITATION][0].value;
        let answerRequest;
        if (value === TAGS.COMPOST) {
          answerRequest = getAnswers({}, {
            label: 'sanitation-compost',
            organization_id: this.get('organization').id,
          }, { withRelated: false });
        }
        if (value === TAGS.BULK) {
          answerRequest = getAnswers({}, {
            label: 'sanitation-bulk-pickup',
            organization_id: this.get('organization').id,
          }, { withRelated: false });
        }
        if (value === TAGS.ELECTRONICS) {
          answerRequest = getAnswers({}, {
            label: 'sanitation-electronics-disposal',
            organization_id: this.get('organization').id,
          }, { withRelated: false });
        }
        if (entities.hasOwnProperty(TAGS.SCHEDULES)) {
          switch (value) {
            // Request Garbage
            case TAGS.GARBAGE:
              answerRequest = getAnswers({}, {
                label: 'sanitation-garbage-schedule',
                organization_id: this.get('organization').id,
              }, { withRelated: false });
              break;
            // Request Recycling
            case TAGS.RECYCLING:
              answerRequest = getAnswers({}, {
                label: 'sanitation-recycling-schedule',
                organization_id: this.get('organization').id,
              }, { withRelated: false });
              break;
          }
        }
        // Handle
        if (answerRequest) {
          answerRequest.then((payload) => {
            const answer = payload.toJSON()[0];
            const message = answer.url ? `${answer.answer} (More info at ${answer.url})` : `${answer.answer}`;
            this.messagingClient.send(this.snapshot.constituent, message);
            this.exit('start');
            return;
          });
        }
      } else {
        this.messagingClient.send(this.snapshot.constituent, 'I\'m not sure I understanding. Can you try phrase that differently?');
        this.exit('start');
      }
    });
  },
};

export default class SmallTalkMachine extends NarrativeStoreMachine {
  constructor(appSession, snapshot) {
    super(appSession, snapshot, smallTalkStates);
    const self = this;

    // Handlers
    function handleMessage() {
      if (typeof self.snapshot.state_machine_current_state !== 'string' && typeof self.snapshot.organization_id !== 'string') {
        self.fire('gettingStarted');
      } else if (self.current) {
        self.fire(self.current);
      } else {
        self.fire('start');
      }
    }

    function handleAction() {
      switch (self.snapshot.data_store.input.payload.payload) {
        case 'GET_STARTED':
          self.fire('gettingStarted');
          break;
        case 'CHANGE_CITY':
          self.fire('location', null, { previous: self.current || self.previous });
          break;
        case 'REGISTER_YOUR_CITY':
          break;
      }
    }

    // Initialize
    const actionType = self.snapshot.data_store.input.type;
    switch (actionType) {
      case 'message':
        handleMessage();
        break;
      case 'action':
        handleAction();
        break;
    }

  }
}
