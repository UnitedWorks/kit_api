import { knex } from '../orm';
import { Person } from './models';
import { crudEntityPhones } from '../phones/helpers';

export const getPersons = (params, options = {}) => {
  return Person.where(params).fetchAll({ withRelated: ['phones'] })
    .then(data => (options.returnJSON ? data.toJSON() : data))
    .catch(error => error)
};

export const createPerson = ({ person, organization }, options = {}) => {
  const personObj = {
    name: person.name,
    title: person.title,
    email: person.email,
    responsibilities: person.responsibilities,
    url: person.url,
    alternate_names: person.alternate_names,
  };
  return Person.forge({ ...personObj, organization_id: organization.id })
    .save(null, { method: 'insert' })
    .then((personModel) => {
      crudEntityPhones({ person_id: personModel.id }, person.phones);
      return options.returnJSON ? personModel.toJSON() : personModel;
    }).catch(error => error);
};

export const updatePerson = (person, options = {}) => {
  const cleanedPerson = Object.assign({}, person);
  delete cleanedPerson.knowledgeCategories;
  delete cleanedPerson.phones;
  return Person.where({ id: person.id })
    .save(cleanedPerson, { method: 'update', patch: true })
    .then((personModel) => {
      crudEntityPhones({ person_id: personModel.id }, person.phones);
      return options.returnJSON ? personModel.toJSON() : personModel;
    }).catch(error => error);
};

export function deletePerson(id) {
  return Promise.all([
    knex('knowledge_answers').where('person_id', '=', id).del().then(p => p),
    knex('knowledge_categorys_fallbacks').where('person_id', '=', id).del().then(p => p),
    knex('organizations_entity_associations').where('person_id', '=', id).del().then(p => p),
    knex('phones_entity_associations').where('person_id', '=', id).del().then(p => p),
  ])
  .then(() => Person.where({ id }).destroy().then(() => ({ id }))
  .catch(error => error)).catch(err => err);
}
