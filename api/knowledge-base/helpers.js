import axios from 'axios';
import { EventRule, KnowledgeAnswer, KnowledgeCategory, KnowledgeFacility, KnowledgeService, KnowledgeQuestion, KnowledgeContact, Location } from './models';
import { CaseLocations, CaseMedia } from '../cases/models';
import geocoder from '../services/geocoder';

export const getAnswers = (params = {}, options) => {
  return KnowledgeQuestion.where({ label: params.label }).fetch({
    withRelated: [{
      answers: q => q.where('organization_id', params.organization_id),
    }, 'category', 'answers.facility', 'answers.facility.location', 'answers.facility.eventRules',
      'answers.service', 'answers.service.location', 'answers.service.eventRules', 'answers.contact'],
  }).then((data) => {
    if (!options.returnJSON) return data.get('answers');
    const answerJSON = data.toJSON().answers;
    if (options.groupKnowledge) {
      const answerGrouped = {
        facilities: answerJSON.filter(a => a.knowledge_facility_id).map(a => a.facility),
        services: answerJSON.filter(a => a.knowledge_service_id).map(a => a.service),
        contacts: answerJSON.filter(a => a.knowledge_contact_id).map(a => a.contact),
      };
      if (answerJSON.filter(a => a.text != null).length > 0) {
        answerGrouped.text = answerJSON.filter(a => a.text != null)[0].text;
        answerGrouped.url = answerJSON.filter(a => a.url != null)[0].url;
      }
      return answerGrouped;
    }
    return answerJSON;
  });
};

export const getQuestions = (params = {}) => {
  return KnowledgeQuestion.fetchAll({ withRelated: {
    category: q => q,
    answers: q => q.where('organization_id', params.organization_id),
  } });
};

export const getCategories = (params = {}) => {
  return KnowledgeCategory.fetchAll({ withRelated: ['questions'] })
    .then(data => data.toJSON().map((category) => {
      // I hate that I have to do this. Tried initializing this data on model
      const newObj = category;
      newObj.totalQuestions = category.questions.length;
      delete newObj.questions;
      return newObj;
    })).catch(error => error);
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

export const updateAnswer = (answer, options) => {
  return KnowledgeAnswer.forge(answer).save(null, { method: 'update' })
    .then(data => options.returnJSON ? data.toJSON() : data)
    .catch(err => err);
};

export const deleteAnswer = (answerId) => {
  return KnowledgeAnswer.forge({ id: answerId }).destroy().then(() => {
    return { id: answerId };
  }).catch(err => err);
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
  return KnowledgeContact.where(params).fetchAll()
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
    .then((results) => {
      return options.returnJSON ? results.toJSON() : results;
    }).catch(error => error);
};

export const updateContact = (contact, options = {}) => {
  return KnowledgeContact.where({ id: contact.id })
    .save(contact, { method: 'update' })
    .then((data) => {
      return options.returnJSON ? data.toJSON() : data;
    }).catch(error => error);
};

export const deleteContact = (contact) => {
  return KnowledgeContact.where({ id: contact.id }).destroy()
    .then(() => {
      return {
        id: contact.id,
      };
    }).catch(error => error);
};
