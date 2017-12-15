import { knex } from '../orm';

export async function quickSetMediaResources(resourceId, media) {
  if (!resourceId) return;
  if (!media || media.length === 0) {
    await knex('resources_medias').where({ resource_id: resourceId }).del().then(d => d);
  }
  knex('resources_medias').where({ resource_id: resourceId }).del().then(() => {
    return knex.batchInsert('resources_medias', media.map(m => ({ media_id: m.id, resource_id: resourceId }))).then(r => r);
  });
}
