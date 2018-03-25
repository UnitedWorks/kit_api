import { geocoder, reverseGeocoder } from '../../utils/geocoder';
import { nlp } from '../../utils/nlp';
import * as TAGS from '../../constants/nlp-tagging';
import * as replyTemplates from '../templates/quick-replies';

export default {

  async location() {
    // If coordinates are attached, avoid NLP Checks Point
    const passedCoordinates = this.snapshot.input.payload &&
      this.snapshot.input.payload.attachments &&
      this.snapshot.input.payload.attachments[0] &&
      this.snapshot.input.payload.attachments[0].type === 'location' ? {
        lat: this.snapshot.input.payload.attachments[0].payload.coordinates.lat,
        lon: this.snapshot.input.payload.attachments[0].payload.coordinates.long,
      } : null;
    if (passedCoordinates) {
      const geoData = await reverseGeocoder(passedCoordinates).then(gd => gd);
      if (geoData) {
        this.set('attributes', {
          ...this.get('attributes'),
          address: geoData,
          location: passedCoordinates,
        });
        return this.messagingClient.send(`Thanks! I've set your address to ${this.get('attributes').address.address_1}${this.get('attributes').address.city ? `, ${this.get('attributes').address.city}` : ''}`)
          .then(() => this.getBaseState());
      }
    // If no coordinates passed, run NLP/text setup
    } else if (this.snapshot.input) {
      const nlpEntities = this.snapshot.nlp
        ? this.snapshot.nlp.entities
        : await nlp.message(this.snapshot.input.payload.text || this.snapshot.input.payload.payload)
          .then(n => n.entities);
      // They want to bounce
      if (nlpEntities.intent && nlpEntities.intent[0].value === 'speech.escape') {
        this.delete('last_input');
        this.messagingClient.send('Ok!', replyTemplates.whatCanIAsk);
        return this.getBaseState();
      }
      if (nlpEntities[TAGS.LOCATION] || nlpEntities[TAGS.SEARCH_QUERY]) {
        // Go through with Setting Location
        let formedString = nlpEntities[TAGS.LOCATION] ? nlpEntities[TAGS.LOCATION][0].value : null;
        // If no location entities, sift through search queries
        if (!formedString) {
          formedString = nlpEntities[TAGS.SEARCH_QUERY] && nlpEntities[TAGS.SEARCH_QUERY].filter(t => /\d/g.test(t.value) && t.value.length > 4).length > 0
          ? nlpEntities[TAGS.SEARCH_QUERY].filter(t => /\d/g.test(t.value))[0].value
          : null;
        }
        if (formedString) {
          const geoData = await geocoder(formedString, this.snapshot.organization.address).then(gd => gd);
          // Location found and passed boundary filters
          if (geoData) {
            const newAttributes = { ...this.get('attributes'), address: geoData };
            if (geoData.location) {
              newAttributes.location = {
                lat: geoData.location.coordinates
                ? geoData.location.coordinates[0] : geoData.location.lat,
                lon: geoData.location.coordinates
                ? geoData.location.coordinates[1] : geoData.location.lon,
              };
            }
            this.set('attributes', newAttributes);
            // So if a location was set, wrap up this state
            if (this.get('attributes').location && this.get('attributes').location.lat) {
              // If we had a previous input, run it
              if (this.get('last_input')) return this.runLastInput();
              // Otherwise, just return to base state
              return this.messagingClient.send(`Thanks! I've set your address to ${this.get('attributes').address.address_1}${this.get('attributes').address.city ? `, ${this.get('attributes').address.city}` : ''}`)
                .then(() => this.getBaseState());
            }
          } else {
            return this.messagingClient.send('Sorry, I didn\'t find that address in your municipality, but I may have just misunderstood. Can you say that again? (Ex: "I live at 62 Erie Street")')
              .then(() => this.getBaseState());
          }
        }
      }
    }
    return this.messagingClient.send('Sorry, I didn\'t catch an address. Can you say that again?')
      .then(() => this.getBaseState());
  },

  async location_closest() {
    // If coordinates are attached, avoid NLP Checks Point
    const passedCoordinates = this.snapshot.input.payload &&
      this.snapshot.input.payload.attachments &&
      this.snapshot.input.payload.attachments[0] &&
      this.snapshot.input.payload.attachments[0].type === 'location' ? {
        lat: this.snapshot.input.payload.attachments[0].payload.coordinates.lat,
        lon: this.snapshot.input.payload.attachments[0].payload.coordinates.long,
      } : null;
    if (passedCoordinates) {
      this.set('attributes', {
        ...this.get('attributes'),
        current_location: passedCoordinates,
      });
    // If no coordinates passed, run NLP/text setup
    } else if (this.snapshot.input) {
      const nlpEntities = this.snapshot.nlp
        ? this.snapshot.nlp.entities
        : await nlp.message(this.snapshot.input.payload.text || this.snapshot.input.payload.payload)
          .then(n => n.entities);
      // NLP shows they want to escape this flow
      if (nlpEntities.intent && nlpEntities.intent[0].value === 'speech.escape') {
        this.delete('last_input');
        this.messagingClient.send('Ok!', replyTemplates.whatCanIAsk);
        return this.getBaseState();
      }
      // Check for location string
      const formedString = nlpEntities[TAGS.LOCATION]
        ? nlpEntities[TAGS.LOCATION][0].value
        : this.snapshot.input.payload.text;
      const geoData = await geocoder(formedString, this.snapshot.organization.address)
        .then(gd => gd);
      if (geoData) {
        this.set('attributes', {
          ...this.get('attributes'),
          current_location: {
            lat: geoData.location.coordinates[0],
            lon: geoData.location.coordinates[1],
          },
        });
      }
    }

    // So if a location was set, wrap up this state
    if (this.get('attributes').current_location && this.get('attributes').current_location.lat) {
      // If we had a previous input, run it
      if (this.get('last_input')) return this.runLastInput();
      // Otherwise, just return to base state
      return this.messagingClient.send("Thanks! I've updated your current location.").then(() => this.getBaseState());
    }

    // If we failed to get setup, ask again
    return this.messagingClient.send('Sorry, I didn\'t catch an address. Can you say that again?', [replyTemplates.location, replyTemplates.exit]);
  },
};
