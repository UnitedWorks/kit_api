import { knex, bookshelf } from '../orm';
import { logger } from '../logger';
import { KnowledgeAnswer, KnowledgeAnswerEvents, KnowledgeAnswerFacilitys, KnowledgeAnswerServices } from './models';

export const getAnswers = (session, params, options) => {
  return KnowledgeAnswer.where({
      label: params.label,
      organization_id: params.organization,
    }).fetchAll({
      withRelated: ['category', 'events', 'facilities', 'services'],
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
    runSave(eventRelationsArray),
    runSave(serviceRelationsArray),
    runSave(facilityRelationsArray),
  ]);
};

const runSave = (collection) => {
  return collection.forEach((model) => {
    return model.save().then((results) => {
      return results;
    });
  });
};
