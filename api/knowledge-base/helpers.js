import { knex } from '../orm';
import { KnowledgeAnswer, KnowledgeCategory, KnowledgeQuestion, Location, Media } from './models';
import { CaseLocations, CaseMedia } from '../cases/models';

export const getAnswers = (params = {}, options) => {
  return KnowledgeQuestion.where({ label: params.label }).fetch({
    withRelated: [{
      answers: q => q.where('organization_id', params.organization_id),
    }, 'category'],
  }).then(data => options.returnJSON ? data.toJSON().answers : data.get('answers'));
};

export const getQuestions = (params = {}) => {
  return KnowledgeQuestion.fetchAll({ withRelated: {
    category: q => q,
    answer: q => q.where('organization_id', params.organization_id),
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
  var values = answer;
  answer.organization_id = organization.id;
  answer.question_id = question.id;

  let insertString = knex('knowledge_answers').insert(answer).toString();

  let conflictString = knex.raw(` ON CONFLICT (organization_id, question_id) DO UPDATE SET text = EXCLUDED.text, url = EXCLUDED.url, knowledge_event_id = EXCLUDED.knowledge_event_id, knowledge_service_id = EXCLUDED.knowledge_service_id, knowledge_facility_id = EXCLUDED.knowledge_facility_id, media_id = EXCLUDED.media_id RETURNING *;`).toString();
  let query = (insertString + conflictString).replace(/\?/g, '\\?');

  return knex.raw(query).then(result => result.rows[0]);
};

export const saveLocation = (locationModel, options = {}) => {
  return new Promise((resolve, reject) => {
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
    Location.forge(newLocationModel).save().then((data) => {
      resolve(options.returnJSON ? data.toJSON() : data);
    }).catch(err => reject(err));
  });
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

export const saveMedia = (attachment, options = {}) => {
  const newModel = {
    type: attachment.type,
    url: attachment.payload.url,
  };
  return Media.forge(newModel).save().then((data) => {
    return options.returnJSON ? data.toJSON() : data;
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
