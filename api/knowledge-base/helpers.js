import { KnowledgeAnswer, KnowledgeCategory, KnowledgeFacility, KnowledgeService, KnowledgeQuestion, Location, Media } from './models';
import { CaseLocations, CaseMedia } from '../cases/models';

export const getAnswers = (params = {}, options) => {
  return KnowledgeQuestion.where({ label: params.label }).fetch({
    withRelated: [{
      answers: q => q.where('organization_id', params.organization_id),
    }, 'category', 'answers.facility', 'answers.service'],
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
  if (answer.text == null || (typeof answer.text === 'string' && answer.text.length === 0)) {
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

export const deleteFacility = (facilityId) => {
  return KnowledgeAnswer.where({ knowledge_facility_id: facilityId }).destroy().then(() => {
    return KnowledgeFacility.forge({ id: facilityId }).destroy().then(() => {
      return { id: facilityId };
    }).catch(err => err);
  }).catch(err => err);
};

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
