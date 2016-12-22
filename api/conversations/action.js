import { logger } from '../logger';
import { interfaces } from './index';
import * as utils from '../utils/index';

export function handleAction(sender, action, responseText, contexts, parameters) {
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

					interfaces.email.send.sendEmail('New job application', emailContent);
				}
			}
			interfaces.facebook.send.sendTextMessage(sender, responseText);
			break;
		case 'job-enquiry':
			let replies = [
				{
					'content_type':'text',
					'title':'Accountant',
					'payload':'Accountant'
				},
				{
					'content_type':'text',
					'title':'Sales',
					'payload':'Sales Rep'
				},
				{
					'content_type':'text',
					'title':'Not interested',
					'payload':'Not interested'
				}
			];
			interfaces.facebook.send.sendQuickReply(sender, responseText, replies);
			break;
		default:
			//unhandled action, just send back the text
			logger.info('send responce in handle actiongit: ' + responseText);
			interfaces.facebook.send.sendTextMessage(sender, responseText);
	}
}
