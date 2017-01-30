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
          type: 'text/html',
          value: content,
        },
      ],
      unique_args: {},
    };

    Object.keys(customAttributes).forEach((key) => {
      // ATM, numbers passed into unique args breaks the API. ARGGGGGGG
      // https://github.com/sendgrid/sendgrid-nodejs/issues/351
      emailRequestObj.unique_args[key] = String(customAttributes[key]);
    });

    logger.info(`Sending Case Email to '${toEmail}'`);

    axios.post('https://api.sendgrid.com/v3/mail/send', emailRequestObj, {
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      },
    }).catch(error => logger.error(error));
  }

}
