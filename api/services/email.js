import axios from 'axios';
import { logger } from '../logger';

export default class EmailService {

  send(subject, content, toEmail, fromEmail, customAttributes = {}) {

    const emailRequestObj = {
      personalizations: [{
        to: [],
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
    };

    // Setup TOs incase there are multiple
    if (typeof toEmail === 'string') {
      emailRequestObj.personalizations[0].to.push({
        email: toEmail,
      });
    } else if (typeof toEmail[0] === 'object') {
      emailRequestObj.personalizations[0].to = toEmail;
    }

    if (Object.keys(customAttributes).length > 0) {
      emailRequestObj.custom_args = {};
      Object.keys(customAttributes).forEach((key) => {
        // ATM, numbers passed into unique args breaks the API. ARGGGGGGG
        // https://github.com/sendgrid/sendgrid-nodejs/issues/351
        emailRequestObj.custom_args[key] = String(customAttributes[key]);
      });
    }

    logger.info(`Sending Email: '${JSON.stringify(emailRequestObj)}'`);
    axios.post('https://api.sendgrid.com/v3/mail/send', emailRequestObj, {
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      },
    }).catch(error => logger.error(error));
  }

}
