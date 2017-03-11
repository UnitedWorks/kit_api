import { KnowledgeAnswer, KnowledgeCategory, KnowledgeFacility, KnowledgeService, KnowledgeQuestion, Location, Media } from './models';
import { CaseLocations, CaseMedia } from '../cases/models';
import { geocoder } from '../services/geocoder';

export const getAnswers = (params = {}, options) => {
  return KnowledgeQuestion.where({ label: params.label }).fetch({
    withRelated: [{
      answers: q => q.where('organization_id', params.organization_id),
    }, 'category', 'answers.facility', 'answers.facility.location',  'answers.service', 'answers.service.location'],
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

export const saveLocation = (locationModel, options = {}) => {
  const newLocationModel = {
    latitude: locationModel.latitude,
    longitude: locationModel.longitude,
    formattedAddress: locationModel.formattedAddress,
    streetNumber: locationModel.streetNumber,
    streetName: locationModel.streetName,
    city: locationModel.city,
    zipcode: locationModel.zipcode,
    country: locationModel.country,
    countryCode: locationModel.countryCode,
    administrativeLevels: locationModel.administrativeLevels,
    extra: locationModel.extra,
  };
  if (Object.prototype.hasOwnProperty.call(locationModel, 'id')) {
    newLocationModel.id = locationModel.id;
  }
  return Location.forge(newLocationModel).save()
    .then(data => options.returnJSON ? data.toJSON() : data)
    .catch(error => error);
};

export const createLocation = (location, options = {}) => {
  let geocodeString = '';
  if (typeof location === 'string') {
    geocodeString = location;
  } else if (location.formattedAddress) {
    geocodeString = location.formattedAddress;
  } else if (location.latitude && location.longitude) {
    geocodeString = `${location.latitude}, ${location.longitude}`;
  } else if (location.streetNumber && location.streetName && location.city && location.country) {
    geocodeString = `${location.streetNumber} ${location.streetName} ${location.city} ${location.country}`;
  } else {
    return null;
  }

  return geocoder.geocode(geocodeString).then((geoData) => {
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
  return createLocation(location, { returnJSON: true }).then((locationJSON) => {
    const composedModel = {
      ...composedFacility,
      location_id: locationJSON ? locationJSON.id : null,
      organization_id: organization.id,
    };
    return KnowledgeFacility.forge(composedModel).save(null, { method: 'insert' })
      .then(data => options.returnJSON ? data.toJSON() : data)
      .catch(err => err);
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
  if (!facility.location.id) {
    return createLocation(facility.location, { returnJSON: true }).then((locationJSON) => {
      return KnowledgeFacility.forge({ ...compiledModel, location_id: locationJSON.id })
        .save(null, { method: 'update' })
        .then(data => options.returnJSON ? data.toJSON() : data)
        .catch(err => err);
    }).catch(err => err);
  }
  return KnowledgeFacility.forge({ compiledModel }).save(null, { method: 'update' })
    .then(data => options.returnJSON ? data.toJSON() : data)
    .catch(err => err);
}

export const deleteFacility = (facilityId) => {
  return KnowledgeAnswer.where({ knowledge_facility_id: facilityId }).destroy().then(() => {
    return KnowledgeFacility.forge({ id: facilityId }).destroy().then(() => {
      return { id: facilityId };
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
  return createLocation(location, { returnJSON: true }).then((locationJSON) => {
    const composedModel = {
      ...composedService,
      location_id: locationJSON ? locationJSON.id : null,
      organization_id: organization.id,
    };
    return KnowledgeService.forge(composedModel).save(null, { method: 'insert' })
      .then(data => options.returnJSON ? data.toJSON() : data)
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
  if (!service.location.id) {
    return createLocation(service.location, { returnJSON: true }).then((locationJSON) => {
      return KnowledgeService.forge({ ...compiledModel, location_id: locationJSON.id })
        .save(null, { method: 'update' })
        .then(data => options.returnJSON ? data.toJSON() : data)
        .catch(err => err);
    }).catch(err => err);
  }
  return KnowledgeFacility.forge({ compiledModel }).save(null, { method: 'update' })
    .then(data => options.returnJSON ? data.toJSON() : data)
    .catch(err => err);
}

export const deleteService = (serviceId) => {
  return KnowledgeAnswer.where({ knowledge_service_id: serviceId }).destroy().then(() => {
    return KnowledgeService.forge({ id: serviceId }).destroy().then(() => {
      return { id: serviceId };
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
