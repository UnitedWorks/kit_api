import { EventRule, KnowledgeAnswer, KnowledgeCategory, KnowledgeFacility, KnowledgeService, KnowledgeQuestion, Location, Media } from './models';
import { CaseLocations, CaseMedia } from '../cases/models';
import geocoder from '../services/geocoder';

export const getAnswers = (params = {}, options) => {
  return KnowledgeQuestion.where({ label: params.label }).fetch({
    withRelated: [{
      answers: q => q.where('organization_id', params.organization_id),
    }, 'category', 'answers.facility', 'answers.facility.location', 'answers.facility.eventRules',
      'answers.service', 'answers.service.location', 'answers.service.eventRules'],
  }).then((data) => {
    if (!options.returnJSON) return data.get('answers');
    const answerJSON = data.toJSON().answers;
    if (options.groupKnowledge) {
      const answerGrouped = {
        facilities: answerJSON.filter(a => a.knowledge_facility_id).map(a => a.facility),
        services: answerJSON.filter(a => a.knowledge_service_id).map(a => a.service),
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
  return Location.forge({
    id: (Object.prototype.hasOwnProperty.call(location, 'id')) ? undefined : location.id,
    lat: location.lat,
    lon: location.lon,
    display_name: location.display_name,
    address: location.address,
  }).save()
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
