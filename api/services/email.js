import { logger } from '../logger';

export default class EmailService {

  constructor() {
    this.service = require('sendgrid');
  }

  send(subject, content, toEmail, fromEmail) {
    const helper = this.service.mail;

    const from = new helper.Email(fromEmail || process.env.EMAIL_FROM);
    const to = new helper.Email(toEmail || process.env.EMAIL_TO);
    const html = new helper.Content('text/html', content);
    const mail = new helper.Mail(from, subject, to, html);

    logger.info('Sending email:', content);

    const sg = this.service(process.env.SENDGRID_API_KEY);
    const request = sg.emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body: mail.toJSON(),
    });

    sg.API(request, (err, response) => {
      if (err) logger.error(err);
      logger.info(response.statusCode);
      logger.info(response.body);
      logger.info(response.headers);
    });
  }

}
