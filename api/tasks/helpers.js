import { knex } from '../orm';
import { Task } from './models';

export function createTask(type, params = {}, { contacts = [], organization_id, constituent_id }) {
  return Task.forge({
    status: 'pending',
    type,
    params,
    constituent_id,
    organization_id,
  }).save(null, { method: 'insert' }).then((newTask) => {
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
