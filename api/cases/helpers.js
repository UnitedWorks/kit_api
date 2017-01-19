import formidable from 'express-formidable';
import { logger } from '../logger';
import * as AccountModels from '../accounts/models';
import { Case, OrganizationsCases } from './models';
import SlackService from '../services/slack';
import EmailService from '../services/email';

export const newCaseNotification = (caseObj, organization) => {
  AccountModels.Organization.where({ id: organization.id }).fetch({ withRelated: ['representatives'] }).then((returnedOrg) => {
    // Emails
    let emailMessage = `Complaint:\n ${caseObj.title}`;
    if (caseObj.location) {
      emailMessage += `\nGeo-location: http://maps.google.com/maps?q=${caseObj.location.latitude},${caseObj.location.longitude}=${caseObj.location.latitude},${caseObj.location.longitude}`;
    }
    if (caseObj.attachments) {
      emailMessage += '\nAttachments:';
      caseObj.attachments.forEach((attachment, index) => {
        emailMessage += `${index + 1}: ${attachment.type || 'Attachment'} - ${attachment.payload.url}`;
      });
    }
    returnedOrg.toJSON().representatives.forEach((rep) => {
      new EmailService().send(`Constituent Complaint #${caseObj.id}: ${caseObj.title}`, emailMessage, rep.email, 'cases@mayor.chat');
    });
    // Slack Notification
    let slackMessage = `>*City*: ${returnedOrg.name}\n>*Constituent ID*: ${caseObj.constituent_id}\n>*Complaint*: ${caseObj.title}`;
    if (caseObj.location) {
      slackMessage += `\n>*Geo-location*: <http://maps.google.com/maps/place/${caseObj.location.latitude},${caseObj.location.longitude}|${caseObj.location.latitude},${caseObj.location.longitude}>`;
    }
    if (caseObj.attachments) {
      slackMessage += '\n>*Attachments*:';
      caseObj.attachments.forEach((attachment) => {
        slackMessage += ` <${attachment.payload.url}|${attachment.type || 'Attachment'}>`;
      });
    }
    new SlackService({ username: 'Constituent Complaint', icon: 'rage' }).send(slackMessage);
  });
};

export const createCase = (title, data, category, constituent, organization) => {
  return new Promise((resolve, reject) => {
    const newCase = {
      status: 'open',
      category_id: category.id,
      constituent_id: constituent.id,
      title,
      data,
    };
    Case.forge(newCase).save().then((caseResponse) => {
      logger.info(caseResponse);
      OrganizationsCases.forge({
        case_id: caseResponse.get('id'),
        organization_id: organization.id,
      }).save().then((orgCaseResposne) => {
        newCaseNotification(caseResponse.toJSON(), organization);
        resolve();
      });
    }).catch((err) => {
      logger.error(err);
      reject();
    });
  });
};

export function webhookHitWithEmail(req) {
  const form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    logger.info(fields);
  });
}
