import { geocoder } from '../../services/geocoder';
import { PRIMARY_CATEGORIES as PRIMARY_CASE_CATEGORIES } from '../../constants/case-categories';
import { createCase } from '../../cases/helpers';
import { CaseCategory } from '../../cases/models';

export const states = {

  complaintStart(aux = {}) {
    const quickReplies = PRIMARY_CASE_CATEGORIES.map((label) => {
      return {
        content_type: 'text',
        title: label,
        payload: label,
      };
    });
    this.messagingClient.send(aux.message || 'What type of problem do you have?', null, quickReplies).then(() => {
      this.exit('complaintCategory');
    });
  },

  complaintCategory() {
    // Check for text answer or passed quick_reply payload
    const category = this.get('input').payload.text || this.get('input').payload.payload;
    CaseCategory.where({ parent_category_id: null }).fetchAll().then((data) => {
      let foundModel;
      let generalModel;
      data.models.forEach((model) => {
        if (model.get('label') === 'General') generalModel = model.toJSON();
        if (model.get('label') === category) foundModel = model.toJSON();
      });
      const complaint = { category: foundModel || generalModel };
      this.set('complaint', complaint);
      this.messagingClient.send('Can you describe the problem for me?');
      this.exit('complaintText');
    });
  },

  complaintText() {
    const headline = this.get('input').payload.text;
    if (headline) {
      this.set('complaint', Object.assign({}, this.get('complaint'), { headline }));
      this.messagingClient.send('Can you provide a picture? If not, simply say you don\'t have one');
      this.exit('complaintPicture');
    }
  },

  complaintPicture() {
    const payload = this.get('input').payload;
    if (payload.attachments) {
      this.messagingClient.send('Thank you!');
      const updatedComplaint = Object.assign({}, this.get('complaint'), {
        attachments: payload.attachments,
      });
      this.set('complaint', updatedComplaint);
    }
    this.messagingClient.send('Can you send your location? That can simply be an address or a pin on the map.');
    this.exit('complaintLocation');
  },

  complaintLocation() {
    const payload = this.get('input').payload;
    if (payload.attachments) {
      const updatedComplaint = Object.assign({}, this.get('complaint'), {
        location: {
          latitude: payload.attachments[0].payload.coordinates.lat,
          longitude: payload.attachments[0].payload.coordinates.long,
        },
      });
      this.set('complaint', updatedComplaint);
      this.fire('complaintSubmit');
    } else if (payload.text) {
      geocoder.geocode(payload.text).then((geoData) => {
        const updatedComplaint = Object.assign({}, this.get('complaint'), {
          location: geoData[Object.keys(geoData)[0]],
        });
        this.set('complaint', updatedComplaint);
        this.fire('complaintSubmit');
      });
    } else {
      this.fire('complaintSubmit');
    }
  },

  complaintSubmit() {
    const complaint = this.get('complaint');
    createCase(complaint.headline, complaint.data, complaint.category, this.snapshot.constituent, this.get('organization'), complaint.location, complaint.attachments).then(() => {
      this.messagingClient.send('I just sent your message along. I\'ll try to let you know when it\'s been addressed.');
      this.exit('start');
    });
  },

};
