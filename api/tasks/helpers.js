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
    let emailMessage = `A new task has been made! <a href="${env.getDashboardRoot()}/interfaces/task?task_id=${fields.task_id}">View Online</a> <br/><br/>`;
    Object.keys(fields.params).forEach((key) => {
      if (fields.params[key].text) {
        emailMessage = emailMessage.concat(`<b>${key}</b> - ${fields.params[key].text}<br/>`);
      } else if (fields.params[key].location) {
        emailMessage = emailMessage.concat(`<b>${key}</b> - ${fields.params[key].location.display_name}<br/>`);
      }
    });
    emailMessage = emailMessage.concat(`<br/><br/>Is it finished? <a href="${env.getDashboardRoot()}/interfaces/task?task_id=${fields.task_id}">Click here to mark it "Completed"</a>`);
    new EmailService().send(emailSubject, emailMessage, knowledgeContacts, 'task@email.kit.community');
  }
}

export async function createTask(type, params = {}, { contacts = [], organization_id, constituent_id }, meta, options = { notify: true }) {
  const cleanedMeta = Object.assign({}, meta);
  if (cleanedMeta.task) delete cleanedMeta.task;
  if (cleanedMeta.see_click_fix) cleanedMeta.see_click_fix = await new SeeClickFixClient().report(params.location.location, params.details.text)
    .then(scfIssue => scfIssue.id);
  return Task.forge({
    status: 'pending',
    type,
    params,
    constituent_id,
    organization_id,
    meta: cleanedMeta,
  }).save(null, { method: 'insert' }).then((newTask) => {
    if (options.notify) {
      taskNotification('created', { knowledge_contacts: contacts }, {
        subject: `🤖 New Task - ${TYPE_MAP[type]}`,
        params,
        task_id: newTask.id,
      });
    }
    return Promise.all(contacts.map((contact) => {
      return knex('tasks_knowledge_contacts')
        .insert({
          knowledge_contact_id: contact.id,
          task_id: newTask.id,
        });
    })).then(joins => joins);
  });
}

export function updateTaskStatus(id, status) {
  return Task.where({ id }).save({ status }, { method: 'update', patch: true });
}

export function getConstituentTasks(id) {
  return Task.where({ constituent_id: id }).fetchAll().then((results) => {
    const refreshedTasks = [];
    results.toJSON().forEach((task) => {
      if (Number(task.meta.see_click_fix) > 0 && task.status === PENDING) {
        refreshedTasks.push(new SeeClickFixClient().syncTaskStatus(task.meta.see_click_fix).then((status) => {
          return { ...task, status };
        }));
      } else {
        refreshedTasks.push(task);
      }
    });
    return Promise.all(refreshedTasks);
  });
}
