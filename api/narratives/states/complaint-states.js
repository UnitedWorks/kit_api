import { geocoder } from '../../services/geocoder';
import { PRIMARY_CATEGORIES as PRIMARY_CASE_CATEGORIES } from '../../constants/case-categories';
import { createCase } from '../../cases/helpers';
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
      const headline = this.snapshot.input.payload.text;
      if (headline) {
        this.set('complaint', Object.assign({}, this.get('complaint'), { headline }));
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
        this.messagingClient.send('Thank you!');
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
        const updatedComplaint = Object.assign({}, this.get('complaint'), {
          location: {
            latitude: payload.attachments[0].payload.coordinates.lat,
            longitude: payload.attachments[0].payload.coordinates.long,
          },
        });
        this.set('complaint', updatedComplaint);
        return 'complaint_submit';
      } else if (payload.text) {
        return geocoder.geocode(payload.text).then((geoData) => {
          const updatedComplaint = Object.assign({}, this.get('complaint'), {
            location: geoData[Object.keys(geoData)[0]],
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
      return createCase(complaint.headline, complaint.data, complaint.category, this.snapshot.constituent, this.get('organization'), complaint.location, complaint.attachments)
        .then(() => {
          this.messagingClient.send('I just sent your message along. I\'ll try to let you know when it\'s been addressed.');
          return 'smallTalk.start';
        });
    },
  },

};
