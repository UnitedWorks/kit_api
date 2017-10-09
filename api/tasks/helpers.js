import { knex } from '../orm';
import { Task } from './models';
import * as env from '../env';
import { KnowledgeContact } from '../knowledge-base/models';
import SeeClickFixClient from './clients/see-click-fix-client';
import { TYPE_MAP, PENDING } from '../constants/tasks';
import EmailService from '../services/email';

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
    let emailMessage = `A new task has been made! <a href="${env.getDashboardRoot()}/interfaces/tasks/${fields.task_id}">View Online</a> <br/><br/>`;
    Object.keys(fields.params).forEach((key) => {
      if (fields.params[key].text) {
        emailMessage = emailMessage.concat(`<b>${key}</b> - ${fields.params[key].text}<br/>`);
      } else if (fields.params[key].location) {
        emailMessage = emailMessage.concat(`<b>${key}</b> - ${fields.params[key].location.display_name}<br/>`);
      }
    });
    emailMessage = emailMessage.concat(`<br/><br/>Is it finished? <a href="${env.getDashboardRoot()}/interfaces/tasks/${fields.task_id}">Click here to mark it "Completed"</a>`);
    new EmailService().send(emailSubject, emailMessage, knowledgeContacts, {}, { email: 'task@email.kit.community', name: 'Hey Mayor!' });
  }
}

export async function createTask(params = {}, { organization_id, constituent_id }, managed) {
  if (managed.see_click_fix) managed.see_click_fix = await new SeeClickFixClient()
    .report(params.location.location, params.notes.text).then(scfIssue => scfIssue.id);
  return Task.forge({
    status: 'pending',
    constituent_id,
    organization_id,
    managed,
  }).save(null, { method: 'insert' }).then(newTask => newTask);
}

export function updateTaskStatus(id, status) {
  return Task.where({ id }).save({ status }, { method: 'update', patch: true });
}

export function getConstituentTasks(id) {
  return Task.where({ constituent_id: id }).fetchAll().then((results) => {
    const refreshedTasks = [];
    results.toJSON().forEach((task) => {
      if (Number(task.managed.see_click_fix) > 0 && task.status === PENDING) {
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
