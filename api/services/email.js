import axios from 'axios';
import { logger } from '../logger';

export default class EmailService {

  send(subject, content, toEmail, fromEmail, customAttributes = {}) {

    const emailRequestObj = {
      personalizations: [{
        to: [{
          email: toEmail,
        }],
        subject,
      }],
      from: {
        email: fromEmail,
      },
      content: [
        {
          type: 'plain/html',
          value: content,
        },
      ],
      // unique_args: customAttributes,
    };

    axios.post('https://api.sendgrid.com/v3/mail/send', emailRequestObj, {
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      },
    }).catch(error => logger.error(error));
  }

}
