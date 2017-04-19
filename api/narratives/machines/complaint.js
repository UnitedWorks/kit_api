import geocoder from '../../services/geocoder';
import * as CASE_CONSTANTS from '../../constants/cases';
import { PRIMARY_CATEGORIES as PRIMARY_CASE_CATEGORIES } from '../../constants/cases';
import { handleConstituentRequest } from '../../cases/helpers';
import { CaseCategory } from '../../cases/models';

export default {
  waiting_for_complaint: {
    enter(aux = {}) {
      const quickReplies = PRIMARY_CASE_CATEGORIES.map((label) => {
        return {
          content_type: 'text',
          title: label,
          payload: label,
        };

      });
      return this.messagingClient.send(aux.message || 'What type of problem do you have?', quickReplies);
    },
    message() {
      // Check for text answer or passed quick_reply payload
      const category = this.snapshot.input.payload.text || this.snapshot.input.payload.payload;
      return CaseCategory.where({ parent_category_id: null }).fetchAll().then((data) => {
        let foundModel;
        let generalModel;
        data.models.forEach((model) => {
          if (model.get('label') === 'General') generalModel = model.toJSON();
          if (model.get('label') === category) foundModel = model.toJSON();
        });
        const complaint = { category: foundModel || generalModel };
        this.set('complaint', complaint);
        return 'waiting_for_complaint_description';
      });
    },
  },

  waiting_for_complaint_description: {
    enter() {
      return this.messagingClient.send('Can you describe the problem for me?');
    },
    message() {
      const title = this.snapshot.input.payload.text;
      if (title) {
        this.set('complaint', Object.assign({}, this.get('complaint'), { title }));
      }
      return 'wait_for_complaint_picture';
    },
  },

  wait_for_complaint_picture: {
    enter() {
      return this.messagingClient.send('Can you provide a picture? If not, simply say you don\'t have one');
    },
    message() {
      const payload = this.snapshot.input.payload;
      if (payload.attachments) {
        const updatedComplaint = Object.assign({}, this.get('complaint'), {
          attachments: payload.attachments,
        });
        this.set('complaint', updatedComplaint);
      }
      return 'wait_for_complaint_location';
    },
  },

  wait_for_complaint_location: {
    enter() {
      this.messagingClient.send('Can you send your location? That can simply be an address or a pin on the map.');
    },
    message() {
      const payload = this.snapshot.input.payload;
      if (payload.attachments) {
        const coordinates = payload.attachments[0].payload.coordinates;
        return geocoder(`${coordinates.lat}, ${coordinates.lon}`).then((geoData) => {
          const updatedComplaint = Object.assign({}, this.get('complaint'), {
            location: geoData[0],
          });
          this.set('complaint', updatedComplaint);
          return 'complaint_submit';
        });
      } else if (payload.text) {
        return geocoder(payload.text).then((geoData) => {
          // Restrict acceptable locations to same country/state
          const filteredGeoData = geoData.filter((location) => {
            return location.address.country_code === (this.get('organization').location.address.country_code || this.get('location').address.country_code)
              && location.address.state === (this.get('organization').location.address.state || this.get('location').address.state);
          });
          const updatedComplaint = Object.assign({}, this.get('complaint'), {
            location: filteredGeoData[0] ? filteredGeoData[0] : payload.text,
          });
          this.set('complaint', updatedComplaint);
          return 'complaint_submit';
        });
      }
      return 'complaint_submit';
    },
  },

  complaint_submit: {
    enter() {
      const complaint = this.get('complaint');
      return handleConstituentRequest({
        title: complaint.title,
        type: CASE_CONSTANTS.REQUEST,
        category: complaint.category,
        location: complaint.location,
        attachments: complaint.attachments,
      },
      this.snapshot.constituent,
      this.get('organization') || { id: this.snapshot.organization_id,
      }).then(() => {
        this.messagingClient.send('I just sent your message along. I\'ll try to let you know when it\'s been addressed.');
        return 'smallTalk.start';
      });
    },
  },

};
