import formidable from 'formidable';
import { knex } from '../orm';
import { logger } from '../logger';
import { Case } from '../cases/models';
import { caseStatusUpdateNotification } from '../cases/helpers';
import { SEND_GRID_EVENT_OPEN } from '../constants/sendgrid';
import { makeAnswer } from '../knowledge-base/helpers';

export function webhookEmail(req) {
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
      // If Complaint Response
      const complaintRegex = /Constituent Complaint #(\d+):/i;
      const complaintResult = complaintRegex.exec(emailData.subject);
      const caseId = Number(complaintResult[1]);
      // If Unanswered Question Response
      const questionRegex = /Missing Answer QID:(\d+) OID:(\d+)/i;
      const questionResult = questionRegex.exec(emailData.subject);
      const questionId = Number(questionResult[0]);
      const orgId = Number(questionResult[1]);
      logger.info(`${questionResult}`);
      logger.info(`${questionId}, ${orgId}`);
      if (caseId) {
        logger.info(`Email Action: Close Case #${caseId}`);
        new Case({ id: caseId }).save({ status: 'closed', closedAt: knex.raw('now()') }, { method: 'update', patch: true }).then((updatedCaseModel) => {
          updatedCaseModel.refresh({ withRelated: ['constituent', 'constituent.facebookEntry'] }).then((refreshedCaseModel) => {
            logger.info(`Case Resolved for Constituent #${refreshedCaseModel.get('constituentId')}`);
            const caseJSON = refreshedCaseModel.toJSON();
            caseStatusUpdateNotification(caseJSON, 'closed', { constituent: caseJSON.constituent });
          });
        });
      } else if (questionId && orgId) {
        logger.info(`Email Action: Fulfill Answer - Question: ${questionId} / Org: ${orgId}`);
        makeAnswer({ id: orgId }, { id: questionId }, { text: emailData.html.trim() })
          .then((answer) => {
            logger.info(`Created Answer: ${answer}`);
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
      // If it has case_id, run status update check
      if (event.case_id) {
        logger.info(`Email Event: Case ${event.case_id} read by ${event.email}`);
        Case.where({ id: event.case_id }).fetch({ withRelated: ['constituent', 'constituent.facebookEntry'] }).then((fetchedCase) => {
          const constituent = fetchedCase.toJSON().constituent;
          if (!fetchedCase.toJSON().lastViewed) {
            caseStatusUpdateNotification(fetchedCase.toJSON(), 'viewed', { constituent });
          }
          fetchedCase.save({
            last_viewed: knex.raw('now()'),
          }, {
            method: 'update',
            patch: true,
          });
        });
      }
      // If it has question_id, run answer update
    }
  });
}
