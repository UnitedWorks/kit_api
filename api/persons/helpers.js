import { knex } from '../orm';
import { Person } from './models';

export const getPersons = (params, options = {}) => {
  return Person.where(params).fetchAll({ withRelated: ['knowledgeCategories'] })
    .then(data => (options.returnJSON ? data.toJSON() : data))
    .catch(error => error)
};

export const createPerson = (data, options = {}) => {
  const person = {
    ...data.person,
    organization_id: data.organization.id,
  };
  return Person.forge(person)
    .save(null, { method: 'insert' })
    .then(personModel => (options.returnJSON ? personModel.toJSON() : personModel))
    .catch(error => error);
};

export const updatePerson = (person, options = {}) => {
  const cleanedPerson = person;
  delete cleanedPerson.knowledgeCategories;
  return Person.where({ id: person.id })
    .save(cleanedPerson, { method: 'update' })
    .then(personModel => (options.returnJSON ? personModel.toJSON() : personModel))
    .catch(error => error);
};

export const deletePerson = (person) => {
  return knex('knowledge_categorys_persons')
    .where('person_id', '=', person.id)
    .del()
    .then(() => {
      return Person.where({ id: person.id }).destroy()
        .then(() => ({ id: person.id }))
        .catch(error => error);
    });
};
