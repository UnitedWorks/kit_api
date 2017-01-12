import { knex } from '../orm';
import { logger } from '../logger';
import { KnowledgeAnswer, KnowledgeAnswerEvents, KnowledgeAnswerFacilitys, KnowledgeAnswerServices } from './models';

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
