import { knex } from '../orm';
import * as env from '../env';
import { Representative } from '../accounts/models';
import { EventRule, KnowledgeAnswer, KnowledgeCategory, KnowledgeFacility, KnowledgeService,
  KnowledgeQuestion, KnowledgeContact, Location } from './models';
import { CaseLocations, CaseMedia } from '../cases/models';
import { upsertPrompt } from '../prompts/helpers';
import geocoder from '../services/geocoder';
import EmailService from '../services/email';

export const incrementTimesAsked = (questionId, orgId) => {
  if (!questionId || !orgId) return;
  return knex('knowledge_question_stats')
    .where('question_id', '=', questionId)
    .andWhere('organization_id', '=', orgId)
    .increment('times_asked', 1)
    .then((rows) => {
      if (rows === 0) {
        return knex.insert({
          question_id: questionId,
          organization_id: orgId,
          times_asked: 1,
        }).into('knowledge_question_stats');
      }
    });
};

export const getAnswers = (params = {}, options = {}) => {
  return KnowledgeQuestion.where({ label: params.label }).fetch({
    withRelated: [{
      answers: q => q.where('organization_id', params.organization_id).whereNotNull('approved_at'),
    }, 'category', 'answers.facility', 'answers.facility.location', 'answers.facility.eventRules',
      'answers.service', 'answers.service.location', 'answers.service.eventRules',
      'answers.contact', 'answers.prompt', 'answers.prompt.steps', 'answers.prompt.actions'],
  }).then((data) => {
    if (!options.returnJSON) return data.get('answers');
    if (data == null) return {};
    // If from state machine, we're passing a flag to increment times_asked
    if (options.incrementTimesAsked) {
      incrementTimesAsked(data.get('id'), params.organization_id);
    }
    const questionJSON = data.toJSON();
    const answerJSON = questionJSON.answers;
    // Reformat Answers
    if (options.groupKnowledge) {
      const answerGrouped = {
        facilities: answerJSON.filter(a => a.knowledge_facility_id).map(a => a.facility),
        services: answerJSON.filter(a => a.knowledge_service_id).map(a => a.service),
        contacts: answerJSON.filter(a => a.knowledge_contact_id).map(a => a.contact),
        prompt: answerJSON.filter(a => a.prompt_id).map(a => a.prompt)[0],
        category: questionJSON.category,
      };
      const baseTextAnswer = answerJSON.filter(a => a.text != null);
      const baseUrlAnswer = answerJSON.filter(a => a.url != null);
      if (baseTextAnswer.length > 0) {
        answerGrouped.text = baseTextAnswer[0].text;
      }
      if (baseUrlAnswer.length > 0) {
        answerGrouped.url = baseUrlAnswer[0].url;
      }
      return { question: questionJSON, answers: answerGrouped };
    }
    return answerJSON;
  });
};

export const getQuestions = (params = {}) => {
  return KnowledgeQuestion.query((qb) => {
    qb.select(['knowledge_questions.id', 'knowledge_questions.question',
      'knowledge_questions.knowledge_category_id', 'knowledge_question_stats.times_asked'])
      .leftOuterJoin('knowledge_question_stats', function() {
        this.on('knowledge_questions.id', '=', 'knowledge_question_stats.question_id');
      })
      .orderByRaw('times_asked DESC NULLS LAST');
  }).fetchAll({
    withRelated: {
      category: q => q,
      answers: q => q.where('organization_id', params.organization_id),
    },
  });
};

export const getCategories = (params = {}) => {
  if (params.organization_id) {
    return KnowledgeCategory.fetchAll({
      withRelated: {
        contacts: q => q.where('organization_id', params.organization_id),
        representatives: q => q.where('organization_id', params.organization_id),
        questions: q => q,
        'questions.answers': q => q.where('organization_id', params.organization_id),
      },
    }).then((data) => {
      return data.toJSON().map((category) => {
        // I hate that I have to do this. Tried initializing this data on model
        const newObj = category;
        newObj.totalQuestions = category.questions.length;
        newObj.answeredQuestions = 0;
        category.questions.forEach((q) => {
          if (q.answers.length > 0) {
            newObj.answeredQuestions += 1;
          }
        });
        delete newObj.questions;
        return newObj;
      });
    }).catch(error => error);
  }
  return KnowledgeCategory.fetchAll().then((data) => {
    return data.toJSON();
  }).catch(error => error);
};

export const setCategoryFallback = ({ organization, category, contacts = [] }) => {
  if (!organization.id) throw new Error('No Organization ID');
  if (!category.id) throw new Error('No Category Provided');
  const relationshipInserts = [];
  contacts.forEach((contact) => {
    relationshipInserts.push(knex('knowledge_categorys_knowledge_contacts').insert({
      knowledge_category_id: category.id,
      knowledge_contact_id: contact.id,
    }));
  });
  // Delete relationships this org's contacts have with this category
  return knex('knowledge_categorys_knowledge_contacts')
    .where('knowledge_category_id', '=', category.id)
    .join('knowledge_contacts', function() {
      this.on('knowledge_categorys_knowledge_contacts.knowledge_contacts_id', '=', 'knowledge_contacts.id')
        .andOn('knowledge_contacts.organization_id', '=', organization.id);
    })
    .del()
    .then(() => Promise.all(relationshipInserts));
};

export const setCategoryRepresentatives = ({ organization, category, representatives = [] }) => {
  if (!organization.id) throw new Error('No Organization ID');
  if (!category.id) throw new Error('No Category Provided');
  const repInserts = [];
  representatives.forEach((representative) => {
    repInserts.push(knex('knowledge_categorys_representatives').insert({
      knowledge_category_id: category.id,
      representative_id: representative.id,
    }));
  });
  // Delete relationships this org's representatives have with this category
  return knex('knowledge_categorys_representatives')
    .where('knowledge_category_id', '=', category.id)
    .join('representatives', function() {
      this.on('knowledge_categorys_representatives.representative_id', '=', 'representatives.id')
        .andOn('representatives.organization_id', '=', organization.id);
    })
    .del()
    .then(() => Promise.all(repInserts));
};

export const makeAnswer = (organization, question, answer, options = { returnJSON: true }) => {
  const newAnswerModel = {
    ...answer,
    question_id: question.id,
    organization_id: organization.id,
  };
  return KnowledgeAnswer.forge(newAnswerModel).save(null, { method: 'insert' })
    .then(data => options.returnJSON ? data.toJSON() : data)
    .catch(error => error);
};

export const upsertEventRules = (eventRules, idsObj) => {
  return Promise.all(
    eventRules.map(rule => EventRule.forge(Object.assign(rule, idsObj)).save())
  ).then(results => results).catch(error => error);
};

export const saveLocation = (location, options = {}) => {
  const locationObj = {};
  if (typeof location === 'string') {
    locationObj.display_name = location;
  } else {
    locationObj.id = (Object.prototype.hasOwnProperty.call(location, 'id')) ? undefined : location.id;
    locationObj.lat = location.lat;
    locationObj.lon = location.lon;
    locationObj.display_name = location.display_name;
    locationObj.address = location.address;
  }
  return Location.forge(locationObj).save()
    .then(data => options.returnJSON ? data.toJSON() : data)
    .catch(error => error);
};

export const createLocation = (location, options = {}) => {
  let geocodeString = '';
  if (typeof location === 'string') {
    geocodeString = location;
  } else if (location.display_name) {
    geocodeString = location.display_name;
  } else if (location.lat && location.lon) {
    geocodeString = `${location.lat}, ${location.lon}`;
  } else if (location.address.street_number && location.address.street_name && location.address.city && location.address.country) {
    geocodeString = `${location.address.street_number} ${location.address.street_name} ${location.address.city} ${location.address.country}`;
  } else {
    return null;
  }

  return geocoder(geocodeString).then((geoData) => {
    if (geoData.length > 1 || geoData.length === 0) {
      throw new Error('Location invalid. Please try again.')
    }
    return saveLocation(geoData[0], { returnJSON: options.returnJSON })
      .then(newLocation => newLocation)
      .catch(err => err);
  }).catch(err => err);
};

export const deleteAnswer = (answerId) => {
  return KnowledgeAnswer.forge({ id: answerId }).destroy().then(() => {
    return { id: answerId };
  }).catch(err => err);
};

export const updateAnswer = (answer, options) => {
  if (((typeof answer.text === 'string' && answer.text.length === 0) || !answer.text)
    && !answer.knowledge_contact_id && !answer.knowledge_event_id && !answer.knowledge_facility_id
    && !answer.knowledge_service_id && !answer.prompt) {
    return deleteAnswer(answer.id);
  }
  return KnowledgeAnswer.forge(answer).save(null, { method: 'update' })
    .then(data => options.returnJSON ? data.toJSON() : data)
    .catch(err => err);
};

export const createFacility = (facility, organization, location, options) => {
  const composedFacility = {
    name: facility.name,
    brief_description: facility.brief_description,
    description: facility.description,
    eligibility_information: facility.eligibility_information,
    phone_number: facility.phone_number,
    url: facility.url,
  };
  const eventRules = facility.eventRules;
  return createLocation(location, { returnJSON: true }).then((locationJSON) => {
    const composedModel = {
      ...composedFacility,
      location_id: locationJSON ? locationJSON.id : null,
      organization_id: organization.id,
    };
    return KnowledgeFacility.forge(composedModel).save(null, { method: 'insert' })
      .then((facilityData) => {
        return upsertEventRules(eventRules, { knowledge_facility_id: facilityData.get('id') })
          .then(() => options.returnJSON ? facilityData.toJSON() : facilityData)
          .catch(err => err);
      }).catch(err => err);
  });
};

export const updateFacility = (facility, options) => {
  const compiledModel = {
    id: facility.id,
    name: facility.name,
    brief_description: facility.brief_description,
    description: facility.description,
    eligibility_information: facility.eligibility_information,
    phone_number: facility.phone_number,
    url: facility.url,
  };
  const eventRules = facility.eventRules;
  if (!facility.location.id) {
    return createLocation(facility.location, { returnJSON: true }).then((locationJSON) => {
      return KnowledgeFacility.forge({ ...compiledModel, location_id: locationJSON.id })
        .save(null, { method: 'update' })
        .then((facilityData) => {
          return upsertEventRules(eventRules, { knowledge_facility_id: facilityData.get('id') })
            .then(() => options.returnJSON ? facilityData.toJSON() : facilityData)
            .catch(err => err);
        })
        .catch(err => err);
    }).catch(err => err);
  }
  return KnowledgeFacility.forge(compiledModel).save(null, { method: 'update' }).then((facilityData) => {
    return upsertEventRules(eventRules, { knowledge_facility_id: facilityData.get('id') })
      .then(() => options.returnJSON ? facilityData.toJSON() : facilityData)
      .catch(err => err);
  }).catch(err => err);
};

export const deleteFacility = (facilityId) => {
  return KnowledgeAnswer.where({ knowledge_facility_id: facilityId }).destroy().then(() => {
    return EventRule.where({ knowledge_facility_id: facilityId }).destroy().then(() => {
      return KnowledgeFacility.forge({ id: facilityId }).destroy().then(() => {
        return { id: facilityId };
      }).catch(err => err);
    }).catch(err => err);
  }).catch(err => err);
};

export const createService = (service, organization, location, options) => {
  const composedService = {
    name: service.name,
    brief_description: service.brief_description,
    description: service.description,
    phone_number: service.phone_number,
    url: service.url,
  };
  const eventRules = service.eventRules;
  return createLocation(location, { returnJSON: true }).then((locationJSON) => {
    const composedModel = {
      ...composedService,
      location_id: locationJSON ? locationJSON.id : null,
      organization_id: organization.id,
    };
    return KnowledgeService.forge(composedModel).save(null, { method: 'insert' })
      .then((serviceData) => {
        return upsertEventRules(eventRules, { knowledge_service_id: serviceData.get('id') })
          .then(() => options.returnJSON ? serviceData.toJSON() : serviceData)
          .catch(err => err);
      })
      .catch(err => err);
  });
};

export const updateService = (service, options) => {
  const compiledModel = {
    id: service.id,
    name: service.name,
    brief_description: service.brief_description,
    description: service.description,
    eligibility_information: service.eligibility_information,
    phone_number: service.phone_number,
    url: service.url,
  };
  const eventRules = service.eventRules;
  if (!service.location.id) {
    return createLocation(service.location, { returnJSON: true }).then((locationJSON) => {
      return KnowledgeService.forge({ ...compiledModel, location_id: locationJSON.id })
        .save(null, { method: 'update' })
        .then((serviceData) => {
          return upsertEventRules(eventRules, { knowledge_service_id: serviceData.get('id') })
            .then(() => options.returnJSON ? serviceData.toJSON() : serviceData)
            .catch(err => err);
        })
        .catch(err => err);
    }).catch(err => err);
  }
  return KnowledgeService.forge(compiledModel).save(null, { method: 'update' })
    .then((serviceData) => {
      return upsertEventRules(eventRules, { knowledge_service_id: serviceData.get('id') })
        .then(() => options.returnJSON ? serviceData.toJSON() : serviceData)
        .catch(err => err);
    })
    .catch(err => err);
}

export const deleteService = (serviceId) => {
  return KnowledgeAnswer.where({ knowledge_service_id: serviceId }).destroy().then(() => {
    return EventRule.where({ knowledge_service_id: serviceId }).destroy().then(() => {
      return KnowledgeService.forge({ id: serviceId }).destroy().then(() => {
        return { id: serviceId };
      }).catch(err => err);
    }).catch(err => err);
  }).catch(err => err);
};

export const associateCaseLocation = (caseObj, location) => {
  return CaseLocations.forge({
    case_id: caseObj.id,
    location_id: location.id,
  }).save();
};

export const associateCaseMedia = (caseObj, media) => {
  return CaseMedia.forge({
    case_id: caseObj.id,
    media_id: media.id,
  }).save();
};

export const makeQuestion = (label, question, categoryId, options = {}) => {
  if (!label) throw new Error('Missing Label');
  if (!question) throw new Error('Missing Question');
  if (!categoryId) throw new Error('Missing Category ID');
  return KnowledgeQuestion.where({ label }).fetch().then((foundModel) => {
    let query;
    let originalJSON;
    if (!foundModel) {
      query = KnowledgeQuestion.forge({
        label,
        question,
        knowledge_category_id: categoryId,
      }).save(null, { method: 'insert' });
    } else {
      originalJSON = foundModel.toJSON();
      query = foundModel.save({
        question,
        knowledge_category_id: categoryId,
      }, { method: 'update', require: true });
    }
    return query.then((data) => {
      if (options.returnMethod) {
        if (!foundModel) {
          return 'INSERTED';
        }
        if (originalJSON.question !== data.toJSON().question ||
          originalJSON.knowledge_category_id !== data.toJSON().knowledge_category_id) {
          return 'UPDATED';
        }
      }
      if (options.returnJSON) return data.toJSON();
      return data;
    }).catch(error => error);
  });
};

export const deleteQuestion = (label) => {
  if (!label) throw new Error('Missing Label');
  return KnowledgeQuestion.where({ label }).fetch().then((foundModel) => {
    if (foundModel) return foundModel.destroy().then(() => 'DELETED');
    return null;
  }).catch(error => error);
};

export const getContacts = (params, options = {}) => {
  return KnowledgeContact.where(params).fetchAll({ withRelated: ['knowledgeCategories'] })
    .then((data) => {
      return options.returnJSON ? data.toJSON() : data;
    }).catch(error => error);
};

export const createContact = (data, options = {}) => {
  const contact = {
    ...data.contact,
    organization_id: data.organization.id,
  };
  return KnowledgeContact.forge(contact)
    .save(null, { method: 'insert' })
    .then((contactModel) => {
      return options.returnJSON ? contactModel.toJSON() : contactModel;
    }).catch(error => error);
};

export const updateContact = (contact, options = {}) => {
  const cleanedContact = contact;
  delete cleanedContact.knowledgeCategories;
  return KnowledgeContact.where({ id: contact.id })
    .save(cleanedContact, { method: 'update' })
    .then((contactModel) => {
      return options.returnJSON ? contactModel.toJSON() : contactModel;
    }).catch(error => error);
};

export const deleteContact = (contact) => {
  return knex('knowledge_categorys_knowledge_contacts')
    .where('knowledge_contact_id', '=', contact.id)
    .del().then(() => {
      return KnowledgeContact.where({ id: contact.id }).destroy().then(() => {
        return {
          id: contact.id,
        };
      }).catch(error => error);
    });
};

export function getQuestionsAsTable(params = {}) {
  const questionFilter = {};
  if (params.knowledge_category_id) {
    questionFilter.knowledge_category_id = params.knowledge_category_id;
  }
  return KnowledgeQuestion.where(questionFilter).fetchAll({
    withRelated: [{
      answers: q => q.where('organization_id', params.organization_id),
    }, 'category'],
  }).then((questionsCollection) => {
    const questionJSON = params.unanswered
      ? questionsCollection.toJSON().filter(q => q.answers.length === 0)
      : questionsCollection.toJSON();
    const finalResults = [];
    questionJSON.forEach((q) => {
      let textAnswer = q.answers.filter(a => a.text);
      if (textAnswer.length === 1) {
        textAnswer = textAnswer[0].text;
      } else {
        textAnswer = '';
      }
      finalResults.push({
        question_id: q.id,
        category: q.category.label,
        question: q.question,
        answer: textAnswer,
      });
    });
    return { rows: finalResults };
  });
}

export function createAnswersFromRows({ answers, organization }, options = { returnJSON: true }) {
  const headerPositions = {
    question_id: null,
    question: null,
    answer: null,
  };
  answers[0].forEach((h, index) => {
    if (h === 'question_id') {
      headerPositions.question_id = index;
    } else if (h === 'question') {
      headerPositions.question = index;
    } else if (h === 'answer') {
      headerPositions.answer = index;
    }
  });
  if (headerPositions.question_id == null) {
    throw new Error('Trouble identifying columns');
  }

  // TODO: Fix this query.
  // Everytime this promise runs, a kitten cries.
  // Tried doing batch inserts w/ unique table constraints but kept hitting edges
  const filteredRows = answers.slice(1)
    .filter(row => row[headerPositions.answer] != null && row[headerPositions.answer].length > 0)
    .map((row) => {
      const rowData = {
        organization_id: organization.id,
        question_id: row[headerPositions.question_id],
        text: row[headerPositions.answer],
      };
      return KnowledgeAnswer.where({
        organization_id: organization.id,
        question_id: rowData.question_id,
      }).fetchAll().then((results) => {
        const textResult = results.toJSON().filter(r => r.text);
        if (textResult.length > 0) {
          return KnowledgeAnswer.forge({ ...rowData, id: textResult[0].id })
            .save(null, { method: 'update' });
        }
        return KnowledgeAnswer.forge({ ...rowData })
          .save(null, { method: 'insert' });
      });
    });

  return Promise.all(filteredRows)
    .then(data => data)
    .catch(error => error);
}

export async function getCategoryFallback(labels, orgId) {
  const fallbackObj = {
    labels,
    organizationId: orgId,
  };
  const categoryFetches = [];
  labels.forEach((label) => {
    categoryFetches.push(KnowledgeCategory.where({ label })
      .fetch({
        withRelated: [{
          contacts: q => q.where('organization_id', '=', orgId),
          representatives: q => q.where('organization_id', '=', orgId),
        }],
      }).then(labelData => (labelData ? labelData.toJSON() : [])),
    );
  });
  const mergedContacts = [];
  const mergedRepresentatives = [];
  await Promise.all(categoryFetches).then((labelData) => {
    labelData.forEach((label) => {
      label.contacts.forEach(contact => mergedContacts.push(contact));
      label.representatives.forEach(rep => mergedRepresentatives.push(rep));
    });
  });
  // If no contacts, look farther up
  if (mergedContacts.length === 0) {
    await KnowledgeCategory.where({ label: 'general' }).fetch({
      withRelated: [{
        contacts: q => q.where('organization_id', '=', orgId),
      }],
    }).then((generalData) => {
      fallbackObj.labels = ['general'];
      fallbackObj.fellback = true;
      fallbackObj.contacts = generalData.toJSON().contacts;
    });
  } else {
    fallbackObj.fellback = false;
    fallbackObj.contacts = mergedContacts;
  }
  // If representatives were assigned, send them an email so we can get an answer
  fallbackObj.representatives = mergedRepresentatives;
  return fallbackObj;
}

export async function answerQuestion(organization, question, answers) {
  await knex('knowledge_answers').where({ organization_id: organization.id, question_id: question.id }).del();
  const answerInserts = [];
  const idHash = {};
  answers.forEach((answer) => {
    // If non-prompt answer
    if (!Object.keys(answer).includes('prompt')) {
      if (Object.values(answer).length > 0 && ((answer.text && answer.text.length > 0) || !Object.keys(answer).includes('text'))) {
        // Check each insert for duplicate
        let answerDuplicate = false;
        if (!idHash[Object.keys(answer)[0]]) {
          idHash[Object.keys(answer)[0]] = [answer[Object.keys(answer)[0]]];
        } else if (idHash[Object.keys(answer)[0]].includes(answer[Object.keys(answer)[0]])) {
          answerDuplicate = true;
        } else {
          idHash[Object.keys(answer)[0]].push(answer[Object.keys(answer)[0]]);
        }
        if (!answerDuplicate) {
          answerInserts.push(knex('knowledge_answers').insert({
            ...answer,
            organization_id: organization.id,
            question_id: question.id,
            approved_at: null,
          }));
        }
      }
    // If prompt answer
    } else {
      answerInserts.push(upsertPrompt({
        ...answer.prompt,
        name: answer.prompt.name || `${question.question} - ${Date(Date.now()).toString()}`,
        organization_id: organization.id,
      }).then(prompt => knex('knowledge_answers').insert({
        prompt_id: prompt.id,
        organization_id: organization.id,
        question_id: question.id,
        approved_at: null,
      })));
    }
  });
  // Send emails about new answers to admins
  const approvalReps = await Representative.where({ organization_id: organization.id, admin: true }).fetchAll()
    .then(r => r.toJSON()).filter(r => r.email)
    .map(r => ({ email: r.email, name: r.name }));
  new EmailService().send(`Answer Needs Approval: ${question.question}`,
    `An employee has saved an answer! Please <a href="${env.getDashboardRoot()}/interfaces/answer?organization_id=${organization.id}&question_id=${question.id}" target="_blank">go approve it</a> so we can send it to constituents.<br/><br/>If you have questions, send <a href="mailto:mark@mayor.chat">us</a> an email!`,
    approvalReps,
    'alert@email.kit.community',
  );
  // Conclude
  return Promise.all(answerInserts).then(() => ({ question }));
}

export function approveAnswers(answers = []) {
  return Promise.all(answers.map((answer) => {
    return knex('knowledge_answers').where({ id: answer.id }).update({ approved_at: knex.raw('now()') }).returning('id');
  })).then(results => ({ answers: results }));
}
