import { knex } from '../orm';
import { KnowledgeAnswer, KnowledgeAnswerEvents, KnowledgeAnswerFacilitys, KnowledgeAnswerServices, Location } from './models';

export const getAnswers = (session, params, options) => {
  const filters = Object.assign({}, params);
  return KnowledgeAnswer.where(filters).fetchAll({
    withRelated: ['category', 'events', 'facilities', 'services'],
  });
};

const runSave = (collection) => {
  return collection.forEach((model) => {
    return model.save().then((results) => {
      return results;
    });
  });
};

export const makeAnswerRelation = (answerModel, events = [], services = [], facilities = []) => {
  const eventRelationsArray = [];
  const serviceRelationsArray = [];
  const facilityRelationsArray = [];
  events.forEach((event) => {
    eventRelationsArray.push(new KnowledgeAnswerEvents({
      knowledge_answer_id: answerModel.id,
      knowledge_event_id: event.id,
    }));
  });
  services.forEach((service) => {
    serviceRelationsArray.push(new KnowledgeAnswerServices({
      knowledge_answer_id: answerModel.id,
      knowledge_service_id: service.id,
    }));
  });
  facilities.forEach((facility) => {
    facilityRelationsArray.push(new KnowledgeAnswerFacilitys({
      knowledge_answer_id: answerModel.id,
      knowledge_facility_id: facility.id,
    }));
  });
  return Promise.all([
    knex.select().where('knowledge_answer_id', answerModel.id).from('knowledge_answers_knowledge_events').del(),
    knex.select().where('knowledge_answer_id', answerModel.id).from('knowledge_answers_knowledge_services').del(),
    knex.select().where('knowledge_answer_id', answerModel.id).from('knowledge_answers_knowledge_facilitys').del(),
  ]).then(() => {
    return Promise.all([
      runSave(eventRelationsArray),
      runSave(serviceRelationsArray),
      runSave(facilityRelationsArray),
    ]);
  });
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
      resolve(options.toJSON ? data.toJSON() : data);
    }).catch(err => reject(err));
  });
};
