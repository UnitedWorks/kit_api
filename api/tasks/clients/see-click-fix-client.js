import axios from 'axios';
import { knex } from '../../orm';
import { PENDING, COMPLETED } from '../../constants/tasks';

export default class SeeClickFix {
  constructor() {
    this.apiURI = process.env.SEE_CLICK_FIX_API_URI;
    this.username = process.env.SEE_CLICK_FIX_USER;
    this.password = process.env.SEE_CLICK_FIX_PASSWORD;
  }

  report(location, text, images) {
    return new Promise((resolve, reject) => {
      const answers = {};
      if (text) {
        answers.summary = text;
      }
      if (images) {
        answers.description = `Image: ${images[0].payload.url}`;
      }
      const payload = {
        address: location.display_name,
        lat: String(location.lat),
        lng: String(location.lon),
        answers,
        request_type_id: 'other',
        anonymize_reporter: true,
      };
      axios.post(`${this.apiURI}/issues`, payload, {
        auth: {
          username: this.username,
          password: this.password,
        },
      })
      .then(res => resolve(res.data))
      .catch(err => reject(err));
    });
  }

  syncTaskStatus(scfId) {
    return new Promise((resolve, reject) => {
      if (!scfId) throw Error('No ID provided for Task Sync');
      axios.get(`${this.apiURI}/issues/${scfId}`).then(({ data }) => {
        let refreshedStatus;
        // Sync open/closed status
        if (data.status.includes('Open', 'Acknowledged')) {
          refreshedStatus = PENDING;
        } else {
          refreshedStatus = COMPLETED;
        }
        knex('tasks')
          .whereRaw("meta->>'see_click_fix'=?", scfId)
          .update({ status: refreshedStatus })
          .returning('status')
          .then(res => resolve(JSON.parse(JSON.stringify(res[0]))))
          .catch(err => reject(err));
      });
    });
  }
}
