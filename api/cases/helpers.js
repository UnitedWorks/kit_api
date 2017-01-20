import formidable from 'formidable';
import { knex } from '../orm';
import { logger } from '../logger';
import * as AccountModels from '../accounts/models';
import { Case, OrganizationsCases } from './models';
import { FacebookMessengerClient, TwilioSMSClient } from '../conversations/clients'
import SlackService from '../services/slack';
import EmailService from '../services/email';

export const newCaseNotification = (caseObj, organization) => {
  AccountModels.Organization.where({ id: organization.id }).fetch({ withRelated: ['representatives'] }).then((returnedOrg) => {
    // Emails
    let emailMessage = '';
    if (caseObj.category) {
      emailMessage += `Category: ${caseObj.category.label}<br/>`;
    }
    emailMessage += `Complaint: ${caseObj.title}<br/>`;
    if (caseObj.location) {
      emailMessage += `Geo-location: http://maps.google.com/maps/place/${caseObj.location.latitude},${caseObj.location.longitude}<br/>`;
    }
    if (caseObj.attachments) {
      emailMessage += 'Attachments:<br/>';
      caseObj.attachments.forEach((attachment, index) => {
        emailMessage += `${index + 1}: ${attachment.type || 'Attachment'} - ${attachment.payload.url}`;
      });
    }
    returnedOrg.toJSON().representatives.forEach((rep) => {
      new EmailService().send(`Constituent Complaint #${caseObj.id}: ${caseObj.title}`, emailMessage, rep.email, 'cases@kit.community');
    });
    // Slack Notification
    let slackMessage = `>*City/Organization*: ${returnedOrg.get('name')}\n>*Category*: ${caseObj.category.label}\n>*Constituent ID*: ${caseObj.constituent_id}\n>*Complaint*: ${caseObj.title}`;
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

export const createCase = (title, data, category, constituent, organization, location, attachments) => {
  return new Promise((resolve, reject) => {
    const newCase = {
      status: 'open',
      category_id: category.id,
      constituent_id: constituent.id,
      title,
      data,
    };
    Case.forge(newCase).save().then((caseResponse) => {
      caseResponse.refresh({ withRelated: ['category'] }).then((refreshedCaseModel) => {
        OrganizationsCases.forge({
          case_id: refreshedCaseModel.get('id'),
          organization_id: organization.id,
        }).save().then(() => {
          newCaseNotification(Object.assign(refreshedCaseModel.toJSON(), {
            location,
            attachments,
          }), organization);
          resolve();
        });
      });
    }).catch((err) => {
      logger.error(err);
      reject();
    });
  });
};

export function webhookHitWithEmail(req) {
  const form = new formidable.IncomingForm();
  form.parse(req, (err, fields) => {
    // Pull Data off Fields
    const emailData = {};
    Object.keys(fields).forEach((key) => {
      emailData[key] = fields[key];
    });
    logger.info(`Email Data: ${JSON.stringify(emailData)}`);
    // Handle Email Actions by Parsing Subject
    if (emailData.subject) {
      const regex = /Constituent Complaint #(\d+):/i;
      const result = regex.exec(emailData.subject);
      const caseId = Number(result[1]);
      if (caseId) {
        logger.info(`Email Action: Close Case #${caseId}`);
        new Case({ id: caseId }).save({ status: 'closed', closedAt: knex.raw('now()') }, { method: 'update', patch: true }).then((updatedCaseModel) => {
          updatedCaseModel.refresh({ withRelated: ['constituent'] }).then((refreshedCaseModel) => {
            logger.info(`Case Resolved for Constituent #${refreshedCaseModel.get('constituentId')}`);
            const constituent = refreshedCaseModel.toJSON().constituent;
            if (constituent.facebook_id) {
              new FacebookMessengerClient().send(constituent, `Your case (#${refreshedCaseModel.id}) has been taken care of!`);
            } else if (constituent.phone) {
              new TwilioSMSClient().send(constituent, `Your case (#${refreshedCaseModel.id}) has been taken care of!`);
            }
          });
        });
      }
    }
  });
}
