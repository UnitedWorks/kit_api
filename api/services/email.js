import { logger } from '../logger';

export class EmailService {

	constructor() {
		this.service = require('sendgrid');
	}

	send(subject, content, toEmail, fromEmail) {
		var helper = this.service.mail;

		var from_email = new helper.Email(fromEmail || process.env.EMAIL_FROM);
		var to_email = new helper.Email(toEmail || process.env.EMAIL_TO);
		var content = new helper.Content('text/html', content);
		var mail = new helper.Mail(from_email, subject, to_email, content);

	  logger.info('Sending email:', content);

		var sg = this.service(process.env.SENDGRID_API_KEY);
		var request = sg.emptyRequest({
			method: 'POST',
			path: '/v3/mail/send',
			body: mail.toJSON()
		});

		sg.API(request, (err, response) => {
		  if (err) logger.error(err);
			logger.info(response.statusCode);
			logger.info(response.body);
			logger.info(response.headers);
		});
	}

}
