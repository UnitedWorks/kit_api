import { knex } from '../orm';
import { Event as EventModel } from './models';

export function deleteEvent(id) {
  return Promise.all([
    knex('addresss_entity_associations').where('event_id', '=', id).del().then(p => p),
    knex('knowledge_answers').where('event_id', '=', id).del().then(p => p),
    knex('organizations_entity_associations').where('event_id', '=', id).del().then(p => p),
    knex('phones_entity_associations').where('event_id', '=', id).del().then(p => p),
  ])
  .then(() => EventModel.where({ id }).destroy().then(() => ({ id }))
  .catch(error => error)).catch(err => err);
}
