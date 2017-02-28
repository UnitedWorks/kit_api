import formidable from 'formidable';
import { knex } from '../orm';
import { logger } from '../logger';
import * as AccountModels from '../accounts/models';
import { Case, OrganizationsCases } from './models';
import { CASE_STATUSES } from '../constants/case-statuses';
import { FacebookMessengerClient, TwilioSMSClient } from '../conversations/clients';
import { saveLocation, saveMedia, associateCaseLocation, associateCaseMedia } from '../knowledge-base/helpers';
import SlackService from '../services/slack';
import EmailService from '../services/email';
import { SEND_GRID_EVENT_OPEN } from '../constants/sendgrid';
import { hasIntegration } from '../integrations/helpers';
import * as INTEGRATIONS from '../constants/integrations';
import SeeClickFixClient from './clients/see-click-fix-client';

export const notifyConstituentOfCaseStatusUpdate = (caseJSON, status, constituentJSON) => {
  let message;
  if (status === 'closed') {
    message = `Your case (#${caseJSON.id}) has been taken care of!`;
  }
  if (status === 'viewed') {
    message = `Your request #${caseJSON.id} has been seen by someone in government! We will let you know when it's addressed.`;
  }
  if (constituentJSON.facebook_id) {
    new FacebookMessengerClient({ constituent: constituentJSON }).send(message);
  } else if (constituentJSON.phone) {
    new TwilioSMSClient({ constituent: constituentJSON }).send(message);
  }
};

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
      new EmailService().send(`Constituent Complaint #${caseObj.id}: ${caseObj.title}`, emailMessage, rep.email, 'cases@kit.community', {
        case_id: caseObj.id,
      });
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

export const createCase = (title, data, category, constituent, organization, location, attachments = [], seeClickFixId) => {
  return new Promise((resolve, reject) => {
    const attachmentPromises = [];
    if (location) attachmentPromises.push(saveLocation(location, { returnJSON: true }));
    attachments.forEach((attachment) => {
      attachmentPromises.push(saveMedia(attachment, { returnJSON: true }));
    });
    Promise.all(attachmentPromises).then((attachmentModels) => {
      const newCase = {
        status: 'open',
        category_id: category.id,
        constituent_id: constituent.id,
        title,
        data,
        seeClickFixId,
      };
      Case.forge(newCase).save().then((caseResponse) => {
        caseResponse.refresh({ withRelated: ['category'] }).then((refreshedCaseModel) => {
          const newCaseModelJSON = refreshedCaseModel.toJSON();
          const junctionPromises = [];

          // Organization Junction
          junctionPromises.push(OrganizationsCases.forge({
            case_id: newCaseModelJSON.id,
            organization_id: organization.id,
          }).save());

          // Location & Media Junction
          attachmentModels.forEach((model) => {
            let joinFn;
            if (model.countryCode) {
              joinFn = associateCaseLocation(newCaseModelJSON, model);
            } else if (model.type) {
              joinFn = associateCaseMedia(newCaseModelJSON, model);
            }
            junctionPromises.push(joinFn);
          });

          Promise.all(junctionPromises).then(() => {
            newCaseNotification(Object.assign(newCaseModelJSON, {
              location,
              attachments,
            }), organization);
            resolve(refreshedCaseModel);
          });
        });
      }).catch(err => reject(err));
    });
  });
};

export const handleConstituentRequest = (headline, data, category, constituent, organization, location, attachments) => {
  return new Promise((resolve, reject) => {
    // Check for integrations to push to
    hasIntegration(organization, INTEGRATIONS.SEE_CLICK_FIX).then((integrated) => {
      if (integrated && new SeeClickFixClient().requestCategoryAllowed(category.label)) {
        new SeeClickFixClient().report(location, headline, attachments).then((scfIssue) => {
          createCase(headline, data, category, constituent, organization, location, attachments,
            scfIssue.id).then(caseObj => resolve(caseObj.toJSON()));
        });
      } else {
        createCase(headline, data, category, constituent, organization, location, attachments)
          .then(caseObj => resolve(caseObj.toJSON()));
      }
    });
  });
};

export const getConstituentCases = (constituent) => {
  return new Promise((requestResolve, reject) => {
    AccountModels.Constituent.where({ id: constituent.id }).fetch({ withRelated: ['cases'] }).then((constituentModel) => {
      const casePromises = [];
      constituentModel.toJSON().cases.forEach((constituentCase) => {
        // If case has see_click_fix_id and is open, we need to check for resolution
        if (constituentCase.seeClickFixId && constituentCase.status === 'open') {
          casePromises.push(new SeeClickFixClient().syncCase(constituentCase.seeClickFixId));
        } else {
          casePromises.push(new Promise(caseResolve => caseResolve(constituentCase)));
        }
      });
      // Resolve all fetches
      Promise.all(casePromises).then(res => requestResolve({ cases: res }));
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
            const caseJSON = refreshedCaseModel.toJSON();
            notifyConstituentOfCaseStatusUpdate(caseJSON, 'closed', caseJSON.constituent);
          });
        });
      }
    }
  });
}

export function webhookEmailEvent(req) {
  logger.info(`Email Events: ${JSON.stringify(req.body)}`);

  // Deduplicate open events
  const messageEventIds = {};
  const events = req.body.filter((event) => {
    // Create array for IDs if it doesnt exist
    if (!messageEventIds[event.event]) {
      messageEventIds[event.event] = [];
    }
    // Check for id
    if (messageEventIds[event.event].includes(event.sg_message_id)) {
      return false;
    }
    // If none found, say this event is ok and include id for future checks
    messageEventIds[event.event].push(event.sg_message_id);
    return true;
  });

  // Run methods on events
  events.forEach((event) => {
    if (event.event === SEND_GRID_EVENT_OPEN) {
      if (event.case_id) {
        logger.info(`Email Event: Case ${event.case_id} read by ${event.email}`);
        Case.where({ id: event.case_id }).fetch({ withRelated: ['constituent'] }).then((fetchedCase) => {
          const constituent = fetchedCase.toJSON().constituent;
          if (!fetchedCase.toJSON().lastViewed) {
            notifyConstituentOfCaseStatusUpdate(fetchedCase.toJSON(), 'viewed', constituent);
          }
          fetchedCase.save({
            last_viewed: knex.raw('now()'),
          }, {
            method: 'update',
            patch: true,
          });
        });
      }
    }
  });
}

export const getOrganizationCases = (orgId, options = {}) => {
  return AccountModels.Organization.where({ id: orgId }).fetch({ withRelated: ['cases', 'cases.category', 'cases.locations', 'cases.media'] })
    .then((fetchedOrg) => {
      if (options.returnJSON) return fetchedOrg.toJSON().cases;
      return fetchedOrg.get('cases');
    }).catch(err => err);
};

export const updateCaseStatus = (caseId, status, options = {}) => {
  if (!CASE_STATUSES.includes(status)) throw new Error(`Unacceptable Status: ${status}`);
  return Case.where({ id: caseId }).save({ status }, { method: 'update' })
    .then(() => {
      return Case.where({ id: caseId }).fetch({ withRelated: ['constituent'] }).then((refreshedModel) => {
        const caseJSON = refreshedModel.toJSON();
        notifyConstituentOfCaseStatusUpdate(caseJSON, status, caseJSON.constituent);
        return options.returnJSON ? refreshedModel.toJSON() : refreshedModel;
      }).catch(error => error);
    }).catch(error => error);
};
