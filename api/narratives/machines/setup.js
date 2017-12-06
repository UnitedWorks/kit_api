import geocoder from '../../utils/geocoder';
import { nlp } from '../../utils/nlp';
import * as TAGS from '../../constants/nlp-tagging';
import * as replyTemplates from '../templates/quick-replies';

export default {

  async location() {
    const nlpEntities = this.snapshot.nlp ? this.snapshot.nlp.entities : await nlp.message(this.snapshot.input.payload.text || this.snapshot.input.payload.payload).then(n => n.entities);
    // They want to bounce
    if (nlpEntities.intent && nlpEntities.intent[0].value === 'speech.escape') {
      this.delete('last_input');
      this.messagingClient.send('Ok!', replyTemplates.whatCanIAsk);
      return this.getBaseState();
    }
    // Go through with Setting Location
    const formedString = nlpEntities[TAGS.LOCATION] ? nlpEntities[TAGS.LOCATION][0].value : this.snapshot.input.payload.text;
    const geoData = await geocoder(formedString, this.snapshot.organization.address).then(gd => gd);
    if (geoData) {
      const newAttributes = { address: geoData, ...this.get('attributes') };
      if (geoData.location) {
        newAttributes.location = {
          lat: geoData.location.coordinates
            ? geoData.location.coordinates[0] : geoData.location.lat,
          lon: geoData.location.coordinates
            ? geoData.location.coordinates[0] : geoData.location.lon,
        };
      }
      this.set('attributes', newAttributes);
      this.messagingClient.send(`Thanks! I've set your default location to ${geoData.address_1}${geoData.city ? `, ${geoData.city}` : ''}`);
      // If we had a previous input, run it
      if (this.get('last_input')) return this.runLastInput();
      // Otherwise, just return to base state
      return this.getBaseState();
    }
    this.messagingClient.send('Sorry, I didn\'t catch an address. Can you say that again?', [replyTemplates.location, replyTemplates.exit]);
  },

  async location_closest() {
    const nlpEntities = this.snapshot.nlp ? this.snapshot.nlp.entities : await nlp.message(this.snapshot.input.payload.text || this.snapshot.input.payload.payload).then(n => n.entities);
    // They want to bounce
    if (nlpEntities.intent && nlpEntities.intent[0].value === 'speech.escape') {
      this.delete('last_input');
      this.messagingClient.send('Ok!', replyTemplates.whatCanIAsk);
      return this.getBaseState();
    }
    // Go through with Setting Location
    const formedString = nlpEntities[TAGS.LOCATION] ? nlpEntities[TAGS.LOCATION][0].value : this.snapshot.input.payload.text;
    const geoData = await geocoder(formedString, this.snapshot.organization.address).then(gd => gd);
    if (geoData) {
      this.set('attributes', {
        ...this.get('attributes'),
        current_location: {
          lat: geoData.location.coordinates[0],
          lon: geoData.location.coordinates[1],
        },
      });
      this.messagingClient.send("Thanks! I've updated your current location.");
      // If we had a previous input, run it
      if (this.get('last_input')) return this.runLastInput();
      // Otherwise, just return to base state
      return this.getBaseState();
    }
    return this.messagingClient.send('Sorry, I didn\'t catch an address. Can you say that again?', [replyTemplates.location, replyTemplates.exit]);
  },
};
