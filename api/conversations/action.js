import { logger } from '../logger';
import * as utils from '../utils/index';
import { EmailService } from '../services/email';
import { SendInterface } from './send';

export class ActionDispatch {

	constructor(config) {
		this.event = config.event;
		this.context = config.context;
	}

	handleAction(sender, action, responseText, contexts, parameters) {

		let SendClient = new SendInterface({
			event: this.event,
			context: this.context,
		});

		switch (action) {
			case 'detailed-application':
				if (utils.isDefined(contexts[0]) && contexts[0].name == 'job_application' && contexts[0].parameters) {
					let phone_number = (utils.isDefined(contexts[0].parameters['phone-number'])
					&& contexts[0].parameters['phone-number']!= '') ? contexts[0].parameters['phone-number'] : '';
					let user_name = (utils.isDefined(contexts[0].parameters['user-name'])
					&& contexts[0].parameters['user-name']!= '') ? contexts[0].parameters['user-name'] : '';
					let previous_job = (utils.isDefined(contexts[0].parameters['previous-job'])
					&& contexts[0].parameters['previous-job']!= '') ? contexts[0].parameters['previous-job'] : '';
					let years_of_experience = (utils.isDefined(contexts[0].parameters['years-of-experience'])
					&& contexts[0].parameters['years-of-experience']!= '') ? contexts[0].parameters['years-of-experience'] : '';
					let job_vacancy = (utils.isDefined(contexts[0].parameters['job-vacancy'])
					&& contexts[0].parameters['job-vacancy']!= '') ? contexts[0].parameters['job-vacancy'] : '';

					if (phone_number != '' && user_name != '' && previous_job != '' && years_of_experience != ''
					&& job_vacancy != '') {
						let emailContent = 'A new job enquiery from ' + user_name + ' for the job: ' + job_vacancy +
								'.<br> Previous job position: ' + previous_job + '.' +
								'.<br> Years of experience: ' + years_of_experience + '.' +
								'.<br> Phone number: ' + phone_number + '.';

						new EmailService().send('New job application', emailContent);
					}
				}
				SendClient.sendTextMessage(sender, responseText);
				break;
			case 'job-enquiry':
				let replies = [{
					'content_type':'text',
					'title':'Accountant',
					'payload':'Accountant',
				}, {
					'content_type':'text',
					'title':'Sales',
					'payload':'Sales Rep',
				}, {
					'content_type':'text',
					'title':'Not interested',
					'payload':'Not interested',
				}];
				SendClient.sendQuickReply(sender, responseText, replies);
				break;
			default:
				//unhandled action, just send back the text
				logger.info('send responce when no action handled: ' + responseText);
				SendClient.sendTextMessage(sender, responseText);
		}

	}

}
