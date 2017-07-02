import { logger } from '../logger';
import * as AccountModels from '../accounts/models';
import { NarrativeSession } from '../narratives/models';
import { Case, CaseCategory, OrganizationsCases } from './models';
import * as CASE_CONSTANTS from '../constants/cases';
import { FacebookMessengerClient, TwilioSMSClient } from '../conversations/clients';
import { createLocation, associateCaseLocation, associateCaseMedia } from '../knowledge-base/helpers';
import { getPrompt } from '../prompts/helpers';
import { saveMedia } from '../media/helpers';
import SlackService from '../services/slack';
import { hasIntegration } from '../integrations/helpers';
import * as INTEGRATIONS from '../constants/integrations';
import SeeClickFixClient from './clients/see-click-fix-client';

export const caseStatusUpdateNotification = (caseObj, status, { constituent, response }) => {
  let message;
  if (status === 'closed') {
    if (response) {
      message = response;
    } else {
      message = `Your request has been addressed! #${caseObj.id} - ${caseObj.title.length > 50 ? caseObj.title.slice(0, 50) : caseObj.title}`;
    }
  } else if (status === 'viewed') {
    message = `Your request #${caseObj.id} has been seen! I'll let you know when it has been addressed.`;
  } else {
    // Don't send a notification about something being opened or re-opened -- status === 'open'
    return;
  }
  try {
    if (constituent.facebook_id) {
      new FacebookMessengerClient({ constituent }).send(message);
    } else if (constituent.phone) {
      new TwilioSMSClient({ constituent }).send(message);
    }
  } catch (e) {
    logger.error(e);
  }
};


export const newCaseNotification = (caseObj, organization) => {
  // Only send notifications when it's a service request
  if (caseObj.type === CASE_CONSTANTS.REQUEST) {
    // Get Representatives of an Org
    AccountModels.Organization.where({ id: organization.id }).fetch({ withRelated: ['representatives'] }).then((returnedOrg) => {
      // Emails
      // Disabling until we nail the normal case situation
      /*
      let emailMessage = '';
      if (caseObj.category) {
        emailMessage += `Category: ${caseObj.category.label}<br/>`;
      }
      emailMessage += `Complaint: ${caseObj.title}<br/>`;
      if (caseObj.location) {
        emailMessage += `Geo-location: http://maps.google.com/maps/place/${caseObj.location.lat},${caseObj.location.lon}<br/>`;
      }
      if (caseObj.attachments) {
        emailMessage += 'Attachments:<br/>';
        caseObj.attachments.forEach((attachment, index) => {
          emailMessage += `${index + 1}: ${attachment.type || 'Attachment'} - ${attachment.payload.url}`;
        });
      }
      returnedOrg.toJSON().representatives.forEach((rep) => {
        new EmailService().send(`Constituent Complaint #${caseObj.id}: ${caseObj.title}`, emailMessage, rep.email, 'reply@email.kit.community', {
          case_id: caseObj.id,
        });
      });
      */

      // Slack Notification
      let slackMessage = `>*City/Organization*: ${returnedOrg.get('name')}\n>*Category*: ${caseObj.category ? caseObj.category.label : 'Undefined '}\n>*Constituent ID*: ${caseObj.constituent_id}\n>*Request*: ${caseObj.title} - ${caseObj.description}`;
      if (caseObj.location) {
        slackMessage += `\n>*Geo-location*: <http://maps.google.com/maps/place/${caseObj.location.display_name}|${caseObj.location.display_name}>`;
      }
      if (caseObj.attachments) {
        slackMessage += '\n>*Attachments*:';
        caseObj.attachments.forEach((attachment) => {
          slackMessage += ` <${attachment.payload.url}|${attachment.type || 'Attachment'}>`;
        });
      }
      new SlackService({ username: 'Constituent Inbound', icon: 'rage' }).send(slackMessage);
    });
  }
};


export const createConstituentCase = (caseObj, constituent, organization) => {
  // Basic Checks
  if (!constituent.id) throw new Error('Missing Key: constituent.id');
  if (!organization.id) throw new Error('Missing Key: organization.id');
  // Helper
  const runCreateCase = ({ title, description, type, category, location, attachments = [], seeClickFixId }) => {
    return new Promise((resolve, reject) => {
      const attachmentPromises = [];
      if (location) attachmentPromises.push(createLocation(location, { returnJSON: true }));
      if (attachments) {
        attachments.forEach((attachment) => {
          attachmentPromises.push(saveMedia(attachment, { returnJSON: true }));
        });
      }
      Promise.all(attachmentPromises).then((attachmentModels) => {
        const newCase = {
          title,
          description,
          status: 'open',
        };
        if (type) newCase.type = type;
        if (category) newCase.category_id = category.id;
        if (constituent) newCase.constituent_id = constituent.id;
        if (seeClickFixId) newCase.see_click_fix_id = seeClickFixId;
        Case.forge(newCase).save().then((caseResponse) => {
          caseResponse.refresh({ withRelated: ['category', 'constituent', 'constituent.facebookEntry'] }).then((refreshedCaseModel) => {
            const newCaseModelJSON = refreshedCaseModel.toJSON();
            const junctionPromises = [];
            // Organization Junction
            if (organization && organization.id) {
              junctionPromises.push(OrganizationsCases.forge({
                case_id: newCaseModelJSON.id,
                organization_id: organization.id,
              }).save());
            }
            // Location & Media Junction
            attachmentModels.forEach((model) => {
              let joinFn;
              if (model.lat || model.display_name || (model.address && model.address.country_code)) {
                joinFn = associateCaseLocation(newCaseModelJSON, model);
              } else if (model.type) {
                joinFn = associateCaseMedia(newCaseModelJSON, model);
              }
              junctionPromises.push(joinFn);
            });
            Promise.all(junctionPromises).then(() => {
              if (organization && organization.id) {
                newCaseNotification(Object.assign(newCaseModelJSON, {
                  location,
                  attachments,
                }), organization);
              }
              resolve(refreshedCaseModel);
            }).catch(err => reject(err));
          }).catch(err => reject(err));
        }).catch(err => reject(err));
      }).catch(err => reject(err));
    });
  };
  // Check integrations before creating
  return new Promise((resolve, reject) => {
    // Check for integrations to push to
    hasIntegration(organization, INTEGRATIONS.SEE_CLICK_FIX).then((integrated) => {
      if (integrated && new SeeClickFixClient().requestCategoryAllowed(caseObj.category.label)) {
        new SeeClickFixClient().report(caseObj.location, caseObj.title, caseObj.attachments)
          .then((scfIssue) => {
            runCreateCase({ ...caseObj, seeClickFixId: scfIssue.id })
              .then(returnedCase => resolve(returnedCase.toJSON()))
              .catch(error => reject(error));
          }).catch(error => reject(error));
      } else {
        runCreateCase(caseObj)
          .then(returnedCase => resolve(returnedCase.toJSON()))
          .catch(error => reject(error));
      }
    });
  });
};


export const getConstituentCases = (constituent) => {
  return AccountModels.Constituent.where({ id: constituent.id }).fetch({ withRelated: ['cases'] }).then((constituentModel) => {
    const casePromises = [];
    constituentModel.toJSON().cases.forEach((constituentCase) => {
      // If case has see_click_fix_id and is open, we need to check for resolution
      if (constituentCase.see_click_fix_id && constituentCase.status === 'open') {
        casePromises.push(new SeeClickFixClient().syncCase(constituentCase.see_click_fix_id));
      } else {
        casePromises.push(new Promise(caseResolve => caseResolve(constituentCase)));
      }
    });
    // Resolve all fetches
    return Promise.all(casePromises).then((response) => {
      return { cases: response };
    });
  });
};

export const getCases = (orgId, options = {}) => {
  let baseQuery = Case.query((qb) => {
    qb.select('*')
      .from('organizations_cases')
      .whereRaw(`organization_id=${orgId}`)
      .join('cases', function() {
        this.on('cases.id', '=', 'organizations_cases.case_id');
      });
  })
  .orderBy('-created_at');

  Object.keys(options.filters).forEach((key) => {
    baseQuery = baseQuery.where(key, '=', options.filters[key]);
  });

  const fetchPageOptions = {
    limit: options.limit || 25,
    offset: options.offset >= 0 ? options.offset : 0,
    withRelated: ['category', 'locations', 'media'],
  };

  return baseQuery.fetchPage(fetchPageOptions)
    .then((fetchedCases) => {
      if (fetchedCases.length === 0) {
        return baseQuery.fetchPage({ ...fetchPageOptions, offset: 0 })
          .then((beginningCases) => {
            return options.returnJSON ? {
              collection: beginningCases.toJSON(),
              pagination: beginningCases.pagination,
            } : beginningCases;
          });
      }
      return options.returnJSON ? {
        collection: fetchedCases.toJSON(),
        pagination: fetchedCases.pagination,
      } : fetchedCases;
    }).catch(err => err);
};


export const updateCaseStatus = (caseId, { response, status, silent = false }, options = {}) => {
  if (!CASE_CONSTANTS.CASE_STATUSES.includes(status)) throw new Error(`Unacceptable Status: ${status}`);
  const updates = { status, response: null };
  if (status === CASE_CONSTANTS.CLOSED) updates.response = response;
  return Case.where({ id: caseId }).save(updates, { method: 'update' }).then(() => {
    return Case.where({ id: caseId }).fetch({ withRelated: ['constituent', 'constituent.facebookEntry', 'constituent.smsEntry'] }).then((refreshedModel) => {
      const caseJSON = refreshedModel.toJSON();
      if (!silent) {
        caseStatusUpdateNotification(caseJSON, status, {
          constituent: caseJSON.constituent,
          response,
        });
      }
      return options.returnJSON ? refreshedModel.toJSON() : refreshedModel;
    }).catch(error => error);
  }).catch(error => error);
};


export const getCaseCategories = (params, options) => {
  return CaseCategory.fetchAll()
    .then(categories => options.returnJSON ? categories.toJSON() : categories)
    .catch(error => error);
};


export const addCaseNote = (caseId, message) => {
  // For now, I'm just appending a message to the description.
  // We're probably going to want to build a table for this
  // Probably also going to need to make a "waiting for reply" status in addition to open/closed
  return Case.where({ id: caseId }).fetch()
    .then((foundCase) => {
      const newDescription = foundCase.get('description') || '';
      return foundCase.save({ description: newDescription.concat(message) }, { method: 'update' });
    }).catch(error => error);
};


export const messageConstituent = (constituentId, message, caseId) => {
  return NarrativeSession.where({ constituent_id: constituentId }).fetch({ withRelated: ['constituent', 'constituent.facebookEntry', 'constituent.smsEntry'] })
    .then((foundSession) => {
      // Message Constituent
      const constituent = foundSession.toJSON().constituent;
      if (constituent.facebook_id) {
        new FacebookMessengerClient({ constituent }).send(message);
      } else if (constituent.phone) {
        new TwilioSMSClient({ constituent }).send(message);
      }
      // If a case was passed in, update Narrative Session to capture response
      if (caseId) {
        const dataStore = foundSession.get('data_store');
        return getPrompt({ label: 'text_response' }).then((prompt) => {
          dataStore.prompt = {
            ...prompt,
            name: message,
            case_id: caseId,
          };
          return foundSession.save({
            data_store: dataStore,
            state_machine_name: 'prompt',
            state_machine_current_state: 'waiting_for_answer',
          }, { method: 'update' });
        }).catch(error => error);
      }
    }).catch(error => error);
};
