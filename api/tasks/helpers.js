import moment from 'moment';
import * as env from '../env';
import { Task } from './models';
import { KnowledgeContact } from '../knowledge-base/models';
import SeeClickFixClient from './clients/see-click-fix-client';
import * as TASK_CONST from '../constants/tasks';
import * as INTEGRATIONS from '../constants/integrations';
import EmailService from '../services/email';
import { messageConstituent } from '../conversations/helpers';
import { getIntegrations } from '../integrations/helpers';

export async function taskNotification(type, contacts, fields) {
  // Reformat Contacts for Sending
  const knowledgeContacts = await Promise.all(contacts.knowledge_contacts
    .map(kc => KnowledgeContact.where({ id: kc.id }).fetch()
      .then(fc => ({ name: fc.get('name'), email: fc.get('email') }))));
  // Send Email
  if (knowledgeContacts) {
    // Subject Line
    let emailSubject;
    if (fields.subject) {
      emailSubject = fields.subject;
    } else if (type === 'created') {
      emailSubject = '🤖 New Task!';
    }
    // Message
    let emailMessage = `A new task has been made! <a href="${env.getDashboardRoot()}/tasks/${fields.task_id}">View Online</a> <br/><br/>`;
    Object.keys(fields.params).forEach((key) => {
      if (fields.params[key].text) {
        emailMessage = emailMessage.concat(`<b>${key}</b> - ${fields.params[key].text}<br/>`);
      } else if (fields.params[key].location) {
        emailMessage = emailMessage.concat(`<b>${key}</b> - ${fields.params[key].location.display_name}<br/>`);
      }
    });
    emailMessage = emailMessage.concat(`<br/><br/>Is it finished? <a href="${env.getDashboardRoot()}/tasks/${fields.task_id}">Click here to mark it "Completed"</a>`);
    new EmailService().send(emailSubject, emailMessage, knowledgeContacts, {}, { email: 'task@email.kit.community', name: 'Hey Mayor!' });
  }
}

export async function createTask(params = {}, { organization_id, constituent_id }, managed) {
  // Get Integrations
  const hasSeeClickFix = await getIntegrations({ organization: { id: organization_id } })
    .then((ints) => {
      const filtered = ints.filter(i => i.label === INTEGRATIONS.SEE_CLICK_FIX);
      return filtered[0] && filtered[0].enabled;
    });
  // If has SCF, push by default
  if (hasSeeClickFix || (managed && managed.see_click_fix)) {
    managed.see_click_fix = await new SeeClickFixClient()
      .report(params.location.location, params.notes.text).then(scfIssue => scfIssue.id);
  }
  return Task.forge({
    status: 'pending',
    constituent_id,
    organization_id,
    managed,
  }).save(null, { method: 'insert' }).then(newTask => newTask);
}

export function updateTaskStatus(id, status, config = { notify: true }) {
  return Task.where({ id }).save({ status }, { method: 'update', patch: true }).then(() => {
    return Task.where({ id }).fetch({ withRelated: ['shout_outs'] }).then((refreshedTask) => {
      // If completed, notify Constituents Who Had Associated Shout Outs
      if (config.notify && status === TASK_CONST.COMPLETED) {
        refreshedTask.toJSON().shout_outs.forEach((shout) => {
          messageConstituent(shout.constituent_id, `Your local government resolved an issue you raised on ${moment(shout.created_at).format('ddd, MMM Do YYYY')} (${shout.label.replace(/_/g, ' ').replace(/\./g, ' - ')})!`);
        });
      }
      // Return Task
      return refreshedTask.toJSON();
    });
  });
}

export function getConstituentTasks(id) {
  return Task.where({ constituent_id: id }).fetchAll().then((results) => {
    const refreshedTasks = [];
    results.toJSON().forEach((task) => {
      if (Number(task.managed.see_click_fix) > 0 && task.status === TASK_CONST.PENDING) {
        refreshedTasks.push(new SeeClickFixClient().syncTaskStatus(task.managed.see_click_fix).then((status) => {
          return { ...task, status };
        }));
      } else {
        refreshedTasks.push(task);
      }
    });
    return Promise.all(refreshedTasks);
  });
}
