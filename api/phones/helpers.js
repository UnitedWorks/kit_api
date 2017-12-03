import { knex } from '../orm';
import { Phone } from './models';

export function cleanPhoneFormating(dirtyPhoneObj) {
  const cleanPhoneObj = dirtyPhoneObj;
  const barePhoneNumber = dirtyPhoneObj.number.replace(/\D/g, '');
  cleanPhoneObj.number = `(${barePhoneNumber.slice(0, 3)}) ${barePhoneNumber.slice(3, 6)}-${barePhoneNumber.slice(6)}`;
  cleanPhoneObj.extension = dirtyPhoneObj.extension.replace(/\D/g, '');
  return cleanPhoneObj;
}

export async function crudEntityPhones(relation, phones) {
  // A relation needs to exist
  if (!relation) return;
  // Get Phone Ids Where Relation Exists
  const existingPhoneIds = await knex.select('phone_id').from('phones_entity_associations').where(relation).then(ids => ids);
  // If no phones exist, delete on the relation
  if (!phones || (phones.length === 0)) {
    // Remove Relations
    await knex('phones_entity_associations').where(relation).del().then(d => d);
    // Remove Phones by ID
    Promise.all((existingPhoneIds || []).map(id => knex('phones').where({ id }).del())).then(r => r);
  } else {
    // Create/Update All Phones, Returning IDs (Delete if no numbers exist)
    const newPhoneIds = await Promise.all(phones.map((phone) => {
      if (phone.id && phone.number.length === 0) {
        return knex('phones_entity_associations').where({ phone_id: phone.id }).del().then(() =>
          knex('phones').where({ id: phone.id }).del().then(() => null));
      } else if (phone.id) {
        return Phone.where({ id: phone.id }).save(cleanPhoneFormating(phone), { method: 'update', patch: true }).then(p => p.id);
      }
      return Phone.forge(cleanPhoneFormating(phone)).save(null, { method: 'insert' }).then(p => p.id);
    })).then(ids => ids.filter(i => i));
    // Create relations between phones/entities
    return knex('phones_entity_associations').where(relation).del().then(() => {
      return knex.batchInsert('phones_entity_associations', newPhoneIds.map(pId => ({ phone_id: pId, ...relation }))).then(r => r)
    });
  }
}
