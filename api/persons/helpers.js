import { knex } from '../orm';
import { Person } from './models';
import { crudEntityPhones } from '../phones/helpers';

export const getPersons = (params, options = {}) => {
  return Person.where(params).fetchAll({ withRelated: ['knowledgeCategories', 'phones'] })
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
  const cleanedPerson = person;
  delete cleanedPerson.knowledgeCategories;
  return Person.where({ id: person.id })
    .save(cleanedPerson, { method: 'update', patch: true })
    .then((personModel) => {
      crudEntityPhones({ person_id: personModel.id }, person.phones);
      return options.returnJSON ? personModel.toJSON() : personModel;
    }).catch(error => error);
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
