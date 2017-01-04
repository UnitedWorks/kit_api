import { logger } from '../logger';
import { KnowledgeAnswerEvents, KnowledgeAnswerFacilitys, KnowledgeAnswerServices } from './models';

const relatedModels = {
  events: KnowledgeAnswerEvents,
  facilities: KnowledgeAnswerFacilitys,
  services: KnowledgeAnswerServices,
};

const runSave = (collection, modelName) => {
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
    runSave(eventRelationsArray, 'events'),
    runSave(serviceRelationsArray, 'services'),
    runSave(facilityRelationsArray, 'facilities'),
  ]);
};
