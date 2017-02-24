import { knex } from '../orm';
import { KnowledgeAnswer, KnowledgeQuestion, KnowledgeAnswerEvents, KnowledgeAnswerFacilitys,
  KnowledgeAnswerServices, Location, OrganizationQuestionAnswers } from './models';

export const getAnswer = (params = {}, options) => {
  if (!params.organization_id) throw Error('No organization_id provided to getAnswer method');
  if (!params.label) throw Error('No label provided to getAnswer method');
  return KnowledgeQuestion.query((qb) => {
    qb.select(['knowledge_questions.id', 'knowledge_questions.label',
      'knowledge_questions_organizations_knowledge_answers.knowledge_answer_id',
      'knowledge_questions_organizations_knowledge_answers.organization_id'])
      .where('knowledge_questions.label', '=', params.label)
      .join('knowledge_questions_organizations_knowledge_answers', function () {
        this.on('knowledge_questions.id', '=', 'knowledge_questions_organizations_knowledge_answers.knowledge_question_id')
          .andOn('knowledge_questions_organizations_knowledge_answers.organization_id', '=', params.organization_id);
      });
  })
  .fetch({ withRelated: ['answer'] })
  .then((results) => {
    if (results) return options.returnJSON ? results.toJSON() : results;
    return {};
  }).catch(error => error);
};

export const getAnswers = (params = {}, options) => {
  return KnowledgeAnswer.where(params).fetchAll({
    withRelated: ['category', 'events', 'facilities', 'services'],
  });
};

export const getQuestions = (params = {}) => {
  return KnowledgeQuestion.fetchAll({ withRelated: ['category'] }).then((allQuestions) => {
    return KnowledgeQuestion.query((qb) => {
      qb.select('*').leftOuterJoin('knowledge_questions_organizations_knowledge_answers', function () {
        this.on('knowledge_questions.id', '=', 'knowledge_questions_organizations_knowledge_answers.knowledge_question_id');
      })
      .where('knowledge_questions_organizations_knowledge_answers.organization_id', '=', params.organization_id);
    })
    .fetchAll({ withRelated: ['category', 'answer'] })
    .then((answeredQuestions) => {
      const resolvedQuestions = [];
      allQuestions.toJSON().map((question) => {
        let pushed = false;
        answeredQuestions.toJSON().forEach((answeredQuestion) => {
          if (answeredQuestion.label === question.label) {
            pushed = true;
            resolvedQuestions.push(answeredQuestion);
          }
        });
        if (!pushed) resolvedQuestions.push(question);
      });
      return resolvedQuestions;
    }).catch(error => error);
  }).catch(error => error);
};

export const makeAnswer = (organization, question, answer, options) => {
  return OrganizationQuestionAnswers.where({
    organization_id: organization.id,
    knowledge_question_id: question.id,
  }).fetch().then((fetchedJunction) => {
    // If no junction found, forge answer and make junction relation
    if (fetchedJunction == null) {
      return KnowledgeAnswer.forge(answer).save(null, { method: 'insert' })
        .then((returnedAnswer) => {
          return OrganizationQuestionAnswers.forge({
            organization_id: organization.id,
            knowledge_question_id: question.id,
            knowledge_answer_id: returnedAnswer.id,
          }).save().then(() => {
            return options.returnJSON ? returnedAnswer.toJSON() : returnedAnswer;
          });
        });
    }
    // Otherwise, just update answer
    return KnowledgeAnswer.where({ id: answer.id }).save(answer, { method: 'update', patch: true })
      .then((returnedAnswer) => {
        return options.returnJSON ? returnedAnswer.toJSON() : returnedAnswer;
      });
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
      resolve(options.returnJSON ? data.toJSON() : data);
    }).catch(err => reject(err));
  });
};
