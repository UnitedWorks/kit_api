import { logger } from '../../logger';
import { NarrativeStateMachine } from './state';
import { client } from '../../services/nlp';
import { geocoder } from '../../services/geocoder';

const smallTalkStates = {
  init() {
    logger.info('SmallTalkState: init');
    // If this is a fresh conversation, do the getting started flow.
    if (!this.snapshot.state_machine_current_state) {
      this.fire('gettingStarted');
    } else {
      this.fire('base');
    }
  },
  gettingStarted() {
    logger.info('SmallTalkState: gettingStarted');
    // Hey how are you!
    // Send picture
    // Thanks for stopping by. I hope I'll be able to help.
    // I'm helping residents get trash schedules, report potholes, and get info for human services.
    this.fire('location');
  },
  location() {
    logger.info('SmallTalkState: location');
    // If no location
    if (!this.datastore.location) {
      // this.changeMachine('location', 'city');
      client.message(this.snapshot.data_store.input.text, {}).then((nlpData) => {
        if (!nlpData.location) {
          this.messagingClient.send(this.snapshot.data_store.constituent, 'Sorry, I don\'t recognize that. Where do you live?')
        }
        geocoder.geocode(nlpData.entities.location[0].value).then((geoData) => {
          this.snapshot.data_store.nlp = nlpData.entities;
          this.snapshot.data_store.location = geoData[Object.keys(geoData)[0]];
          if (Object.keys(geoData).length > 1) {
            const message = `Did you mean ${geoData['0'].formattedAddress}? If not, give a bit more detail.`;
            this.messagingClient.send(this.snapshot.data_store.constituent, message)
            this.fire('locationClarification');
          } else {
            const message = `Thanks! I passed through there a few times.`;
            this.messagingClient.send(this.snapshot.data_store.constituent, message)
            this.fire('locationSet');
          }
        }).catch(logger.info);
      }).catch(logger.info);
    } else {
      this.fire('base');
    }
  },
  locationClarification() {
    logger.info('SmallTalkState: locationClarification');
  },
  locationSet() {
    logger.info('SmallTalkState: locationSetting');
    // - add location to user?
    // - associate constituent with a organization?
    // - save the narrative_state to DB
    this.fire('base');
  },
  base() {
    logger.info('SmallTalkState: base');
    logger.info(this.snapshot);
  },
};

export default class SmallTalkMachine extends NarrativeStateMachine {
  constructor(appSession, snapshot) {
    super(appSession, snapshot, smallTalkStates);
  }
}
