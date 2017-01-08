import { logger } from '../../logger';
import { NarrativeStoreMachine } from './state';
import { nlp } from '../../services/nlp';
import { geocoder } from '../../services/geocoder';

const smallTalkStates = {
  init() {
    // If this is a fresh conversation, do the getting started flow.
    this.fire('base');
  },
  gettingStarted() {
    this.messagingClient.send(this.snapshot.constituent, 'Hi, thanks for getting in touch!');
    this.messagingClient.send(this.snapshot.constituent, 'I\'m an AI bot that helps you connect with you city and community. You can call me the mayor ;), but I also go by Jane or Angela!');
    this.messagingClient.send(this.snapshot.constituent, 'I can tell you the trash schedule, help you report a pothole, anonymously notify departments of injustices you face, and more! I\'m constantly trying to do more for you.');
    this.messagingClient.send(this.snapshot.constituent, 'I just need to know a few things I can help!');
    this.fire('location');
  },
  location() {
    const input = this.get('input');
    nlp.message(input.text, {}).then((nlpData) => {
      geocoder.geocode(nlpData.entities.location[0].value).then((geoData) => {
        this.set('nlp', nlpData.entities);
        this.set('location', geoData[Object.keys(geoData)[0]])
        if (Object.keys(geoData).length > 1) {
          const message = `Did you mean ${geoData['0'].formattedAddress}? If not, give a bit more detail.`;
          this.messagingClient.send(this.snapshot.constituent, message);
          this.exit('location');
        } else if (Object.keys(geoData).length === 1) {
          this.set('location', geoData[0]);
          this.fire('setOrganization');
        } else {
          const message = this.previous !== 'location' ? 'What city are you located in?' : 'Hmm, I`m not familiar with that city. I might need a state or zipcode.';
          this.messagingClient.send(this.snapshot.constituent, message);
          this.exit('location');
        }
      }).catch(logger.info);
    }).catch(logger.info);
  },
  setOrganization() {
    logger.info('Set Organization');
    const message = `Oh! I've passed through ${this.get('location').city} there a few times.`;
    this.messagingClient.send(this.snapshot.constituent, message);
    // - add location to user?
    // - associate constituent with a organization?
  },
  base() {
  },
};

export default class SmallTalkMachine extends NarrativeStoreMachine {
  constructor(appSession, snapshot) {
    super(appSession, snapshot, smallTalkStates);
  }
}
