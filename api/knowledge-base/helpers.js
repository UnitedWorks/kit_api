import axios from 'axios';
import { knex } from '../orm';
import { EventRule, KnowledgeAnswer, KnowledgeCategory, KnowledgeFacility, KnowledgeService,
  KnowledgeQuestion, KnowledgeContact, Location } from './models';
import { CaseLocations, CaseMedia } from '../cases/models';
import geocoder from '../services/geocoder';

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
      answers: q => q.where('organization_id', params.organization_id),
    }, 'category', 'answers.facility', 'answers.facility.location', 'answers.facility.eventRules',
      'answers.service', 'answers.service.location', 'answers.service.eventRules',
      'answers.contact', 'answers.survey', 'answers.survey.questions'],
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
        survey: answerJSON.filter(a => a.survey_id).map(a => a.survey)[0],
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
      .andOn('knowledge_contacts.organization_id', '=', organization.id)
    })
    .del()
    .then(() => Promise.all(relationshipInserts));
};

export const makeAnswer = (organization, question, answer, options) => {
  const newAnswerModel = {
    ...answer,
    question_id: question.id,
    organization_id: organization.id,
  };
  if (typeof answer.text === 'string' && answer.text.length === 0) {
    throw new Error('Empty text field given to answer');
  }
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
  if (typeof answer.text === 'string' && answer.text.length === 0) {
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

export const syncSheetKnowledgeBaseQuestions = () => {
  const upsertRequest = axios.get(`https://sheets.googleapis.com/v4/spreadsheets/${process.env.GOOGLE_SHEET_KNOWLEDGE_BASE_ID}/values/LIVE`, {
    params: {
      key: process.env.GOOGLE_SHEET_API_KEY,
    },
  }).then((sheetData) => {
    const categoryHash = {};
    return KnowledgeCategory.fetchAll().then((categories) => {
      categories.toJSON().forEach((category) => {
        categoryHash[category.label] = category.id;
      });
      const sheetValues = sheetData.data.values.slice(1);
      return Promise.all(sheetValues.map((row) => {
        return makeQuestion(row[1], row[2], categoryHash[row[0]], { returnMethod: true });
      })).then((data) => {
        return {
          inserted: data.filter(result => result === 'INSERTED').length,
          updated: data.filter(result => result === 'UPDATED').length,
        };
      });
    });
  });
  const deletionRequest = axios.get(`https://sheets.googleapis.com/v4/spreadsheets/${process.env.GOOGLE_SHEET_KNOWLEDGE_BASE_ID}/values/DELETED`, {
    params: {
      key: process.env.GOOGLE_SHEET_API_KEY,
    },
  }).then((sheetData) => {
    const sheetValues = sheetData.data.values.slice(1);
    return Promise.all(sheetValues.map((row) => {
      return deleteQuestion(row[1]);
    })).then((data) => {
      return {
        deleted: data.filter(result => result === 'DELETED').length,
      };
    });
  });
  return Promise.all([upsertRequest, deletionRequest])
    .then((data) => {
      return {
        deleted: data[1].deleted,
        inserted: data[0].inserted,
        updated: data[0].updated,
      };
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
  return KnowledgeContact.where({ id: contact.id })
    .save(contact, { method: 'update' })
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

export function getCategoryFallback(label, orgId) {
  return KnowledgeCategory.where({ label })
    .fetch({ withRelated: [{
      contacts: q => q.where('organization_id', '=', orgId),
    }] }).then((labelData) => {
      // If no contacts, look farther up
      if (labelData.toJSON().contacts.length === 0) {
        return KnowledgeCategory.where({ label: 'general' })
          .fetch({ withRelated: [{
            contacts: q => q.where('organization_id', '=', orgId),
          }] }).then((generalData) => {
            return {
              label: 'general',
              fellback: true,
              organizationId: orgId,
              contacts: generalData.toJSON().contacts,
            };
          });
      }
      return {
        label,
        fellback: false,
        organizationId: orgId,
        contacts: labelData.toJSON().contacts,
      };
    });
}
