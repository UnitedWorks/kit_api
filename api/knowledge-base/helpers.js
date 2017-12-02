import stringSimilarity from 'string-similarity';
import { knex } from '../orm';
import * as env from '../env';
import { Representative } from '../accounts/models';
import { KnowledgeAnswer, KnowledgeCategory, Place, Service,
  KnowledgeQuestion, Person, Location } from './models';
import { Vehicle } from '../vehicles/models';
import geocoder from '../services/geocoder';
import EmailService from '../services/email';
import { runFeed } from '../feeds/helpers';
import * as KNOWLEDGE_CONST from '../constants/knowledge-base';
import { ShoutOutTrigger } from '../shouts/models';
import ShoutOuts from '../shouts/logic';

export const incrementTimesAsked = (questionId, orgId) => {
  if (!questionId || !orgId) return;
  return knex('knowledge_questions_stats')
    .where('knowledge_question_id', '=', questionId)
    .andWhere('organization_id', '=', orgId)
    .increment('times_asked', 1)
    .then((rows) => {
      if (rows === 0) {
        return knex.insert({
          knowledge_question_id: questionId,
          organization_id: orgId,
          times_asked: 1,
        }).into('knowledge_questions_stats');
      }
    });
};

export async function getAnswers(params = {}, options = { returnJSON: true }) {
  const data = await KnowledgeQuestion.where({ label: params.label }).fetch({
    withRelated: [{
      answers: q => q.where('organization_id', params.organization_id).whereNotNull('approved_at'),
    }, 'category', 'answers.place', 'answers.place.location', 'answers.service',
      'answers.service.location', 'answers.person', 'answers.feed', 'answers.media'],
  }).then(d => d);
  if (!options.returnJSON) return data.get('answers');
  if (data == null) return {};
  // If from state machine, we're passing a flag to increment times_asked
  if (options.incrementTimesAsked) {
    incrementTimesAsked(data.get('id'), params.organization_id);
  }
  const questionJSON = data.toJSON();
  const answerJSON = questionJSON.answers;
  // If a vague intent, get other questions
  if (questionJSON.vague) {
    const altQuestions = await KnowledgeQuestion.where('label', '~', `${questionJSON.label}.`).fetchAll().then(results => results.toJSON());
    return { question: questionJSON, altQuestions };
  } else if (options.groupKnowledge && answerJSON.length > 0) {
    // Reformat Answers
    const answerGrouped = {
      category: questionJSON.category,
      places: answerJSON.filter(a => a.place_id).map(a => a.place),
      services: answerJSON.filter(a => a.service_id).map(a => a.service),
      persons: answerJSON.filter(a => a.person_id).map(a => a.person),
      events: await Promise.all(answerJSON.filter(a => a.feed_id)
        .map(answer => runFeed(answer.feed).then(found => found.events)))
        .then((feed) => {
          let flattenedArray = [];
          feed.filter(f => f).forEach(f => (flattenedArray = flattenedArray.concat(...f)));
          return flattenedArray;
        }),
      media: answerJSON.filter(a => a.media_id).map(a => a.media),
      actions: answerJSON.filter(a => a.actions).map(a => a.actions)[0],
    };
    const baseTextAnswer = answerJSON.filter(a => a.text != null);
    if (baseTextAnswer.length > 0) {
      answerGrouped.text = baseTextAnswer[0].text;
    }
    return { question: questionJSON, answers: answerGrouped };
  }
  return { question: questionJSON, answers: answerJSON };
}

export async function searchEntitiesBySimilarity(strings = [], organizationId, options = { returnJSON: true, limit: 10, confidence: 0.3 }) {
  if (strings.length === 0) return [];
  // Postgres UNION ALL could make this more efficient... but hit a snag with results columns
  const searchFunctions = [];
  strings.forEach((str) => {
    searchFunctions.push(knex.select(knex.raw(`*, similarity(name, '${str}') as similarity`)).from('services').where('organization_id', '=', organizationId).orderBy('similarity', 'desc').limit(10).leftJoin('locations', 'services.location_id', '=', 'locations.id')
      .then(d => d.map(s => ({ type: 'service', payload: { ...s, location: { display_name: s.display_name, address: s.address } } })).filter(s => s.payload.similarity > options.confidence)));
    searchFunctions.push(knex.select(knex.raw(`*, similarity(unnest(alternate_names), '${str}') AS similarity`)).from('services').where('organization_id', '=', organizationId).orderBy('similarity', 'desc').limit(10).leftJoin('locations', 'services.location_id', '=', 'locations.id')
      .then(d => d.map(s => ({ type: 'service', payload: { ...s, location: { display_name: s.display_name, address: s.address } } })).filter(s => s.payload.similarity > options.confidence)));

    searchFunctions.push(knex.select(knex.raw(`*, similarity(name, '${str}') as similarity`)).from('places').where('organization_id', '=', organizationId).orderBy('similarity', 'desc').limit(10).leftJoin('locations', 'places.location_id', '=', 'locations.id')
      .then(d => d.map(f => ({ type: 'place', payload: { ...f, location: { display_name: f.display_name, address: f.address } } })).filter(f => f.payload.similarity > options.confidence)));
    searchFunctions.push(knex.select(knex.raw(`*, similarity(unnest(alternate_names), '${str}') AS similarity`)).from('places').where('organization_id', '=', organizationId).orderBy('similarity', 'desc').limit(10).leftJoin('locations', 'places.location_id', '=', 'locations.id')
      .then(d => d.map(f => ({ type: 'place', payload: { ...f, location: { display_name: f.display_name, address: f.address } } })).filter(f => f.payload.similarity > options.confidence)));

    searchFunctions.push(knex.select(knex.raw(`*, similarity(name, '${str}') as similarity`)).from('persons').where('organization_id', '=', organizationId).orderBy('similarity', 'desc').limit(10)
      .then(d => d.map(c => ({ type: 'person', payload: c })).filter(c => c.payload.similarity > options.confidence)));
    searchFunctions.push(knex.select(knex.raw(`*, similarity(unnest(alternate_names), '${str}') AS similarity`)).from('persons').where('organization_id', '=', organizationId).orderBy('similarity', 'desc').limit(10)
      .then(d => d.map(c => ({ type: 'person', payload: c })).filter(c => c.payload.similarity > options.confidence)));
    searchFunctions.push(knex.select(knex.raw(`*, similarity(title, '${str}') as similarity`)).from('persons').where('organization_id', '=', organizationId).orderBy('similarity', 'desc').limit(10)
      .then(d => d.map(c => ({ type: 'person', payload: c })).filter(c => c.payload.similarity > options.confidence)));
  });
  const results = await Promise.all(searchFunctions).then((data) => {
    const allEntities = [];
    data.forEach(entities => entities.forEach((e) => {
      let entityListed = false;
      for (let i = 0; i < allEntities.length; i += 1) {
        if (allEntities[i].name === e.name && allEntities[i].id === e.id) entityListed = true;
      }
      if (!entityListed) allEntities.push(e);
    }));
    return allEntities.sort((a, b) => a.payload.similarity
      < b.payload.similarity).slice(0, options.limit);
  });
  return options.returnJSON ? JSON.parse(JSON.stringify(results)) : results;
}

export async function getEntitiesByFunction(strings = [], organizationId, options = {}) {
  if (strings.length === 0) return [];
  const getFunctions = [];
  strings.forEach((str) => {
    getFunctions.push(Place.query(qb => qb.whereRaw(`'${str}' = ANY(places.functions)`).andWhere('organization_id', '=', organizationId))
      .fetchAll({ withRelated: ['location'] }).then(d => d.toJSON().map(f => ({ type: 'place', payload: f }))));
    getFunctions.push(Service.query(qb => qb.whereRaw(`'${str}' = ANY(services.functions)`).andWhere('organization_id', '=', organizationId))
      .fetchAll({ withRelated: ['location'] }).then(d => d.toJSON().map(s => ({ type: 'service', payload: s }))));
  });
  const results = await Promise.all(getFunctions)
    .then(data => [...data[0], ...data[1]]);
  return options.sortStrings
    ? results.sort((a, b) => {
      let aSimHigh = null;
      let bSimHigh = null;
      options.sortStrings.forEach((str) => {
        const aScore = stringSimilarity.compareTwoStrings(str, a.payload.name || '');
        const bScore = stringSimilarity.compareTwoStrings(str, b.payload.name || '');
        if (!aSimHigh || aScore > aSimHigh) aSimHigh = aScore;
        if (!bSimHigh || bScore > bSimHigh) bSimHigh = bScore;
      });
      return bSimHigh - aSimHigh;
    }) : results;
}

export const getQuestions = (params = {}, options = {}) => {
  if (!params.organization_id) throw new Error('No Organization ID Provided');
  // Get Questions with Answers
  return KnowledgeQuestion.query((qb) => {
    qb.select(['knowledge_questions.id', 'knowledge_questions.question', 'knowledge_questions.label',
      'knowledge_questions.knowledge_category_id', 'knowledge_questions_stats.times_asked'])
      .leftOuterJoin('knowledge_questions_stats', function() {
        this.on('knowledge_questions.id', '=', 'knowledge_questions_stats.knowledge_question_id');
      })
      .where('knowledge_questions_stats.organization_id', '=', params.organization_id)
      .orWhereNull('knowledge_questions_stats.organization_id')
      .orderByRaw('times_asked DESC NULLS LAST');
  }).fetchAll({
    withRelated: {
      category: q => q,
      answers: q => q.where('organization_id', params.organization_id),
    },
  }).then((questions) => {
    // Append Trigger Configurations for Shoutouts
    return ShoutOutTrigger.where({ organization_id: params.organization_id }).fetchAll()
      .then((data) => {
        const triggers = data.toJSON();
        // Check if any triggers have been set. If none, just return questions
        if (triggers.length === 0) return questions.toJSON();
        // Otherwise load up configs
        return questions.toJSON().map((question) => {
          if (question.answers) {
            question.answers.map((answer) => {
              if (answer.actions && answer.actions.shout_out) {
                triggers.forEach((t) => {
                  if (t.label === question.label) answer.actions.config = t.config;
                });
              }
            });
          }
          return question;
        });
      });
  });
};

export const getCategories = (params = {}) => {
  if (params.organization_id) {
    return KnowledgeCategory.fetchAll({
      withRelated: {
        persons: q => q.where('persons.organization_id', params.organization_id),
        representatives: q => q.where('representatives.organization_id', params.organization_id),
        questions: q => q,
        'questions.answers': q => q.where('knowledge_answers.organization_id', params.organization_id),
      },
    }).then((data) => {
      return data.toJSON().map((category) => {
        // I hate that I have to do this. Tried initializing this data on model
        const newObj = category;
        newObj.totalQuestions = category.questions.length;
        newObj.answeredQuestions = 0;
        category.questions.forEach((q) => {
          if (q.answers.length > 0) {
            newObj.answeredQuestions += 1;
          }
        });
        delete newObj.questions;
        return newObj;
      });
    }).catch(error => error);
  }
  return KnowledgeCategory.fetchAll().then((data) => {
    return data.toJSON();
  }).catch(error => error);
};

export const setCategoryFallback = ({ organization, category, persons = [] }) => {
  if (!organization.id) throw new Error('No Organization ID');
  if (!category.id) throw new Error('No Category Provided');
  const relationshipInserts = [];
  persons.forEach((person) => {
    relationshipInserts.push(knex('knowledge_categorys_persons').insert({
      knowledge_category_id: category.id,
      person_id: person.id,
      organization_id: organization.id,
    }));
  });
  // Delete relationships this org's persons have with this category
  return knex.select('*').from('knowledge_categorys_persons')
    .where('knowledge_category_id', '=', category.id)
    .andWhere('organization_id', '=', organization.id)
    .del()
    .then(() => Promise.all(relationshipInserts));
};

export const setCategoryRepresentatives = ({ organization, category, representatives = [] }) => {
  if (!organization.id) throw new Error('No Organization ID');
  if (!category.id) throw new Error('No Category Provided');
  const repInserts = [];
  representatives.forEach((representative) => {
    repInserts.push(knex('knowledge_categorys_representatives').insert({
      knowledge_category_id: category.id,
      representative_id: representative.id,
      organization_id: organization.id,
    }));
  });
  // Delete relationships this org's representatives have with this category
  return knex.select('*').from('knowledge_categorys_representatives')
    .where('knowledge_category_id', '=', category.id)
    .andWhere('organization_id', '=', organization.id)
    .del()
    .then(() => Promise.all(repInserts));
};

export const makeAnswer = (organization, question, answer, options = { returnJSON: true }) => {
  const newAnswerModel = {
    ...answer,
    knowledge_question_id: question.id,
    organization_id: organization.id,
  };
  return KnowledgeAnswer.forge(newAnswerModel).save(null, { method: 'insert' })
    .then(data => options.returnJSON ? data.toJSON() : data)
    .catch(error => error);
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
  } else if (location.address && location.address.street_number && location.address.street_name && location.address.city && location.address.country) {
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

export const deleteAnswer = (answerId) => {
  return KnowledgeAnswer.forge({ id: answerId }).destroy().then(() => {
    return { id: answerId };
  }).catch(err => err);
};

export const updateAnswer = (answer, options) => {
  if (((typeof answer.text === 'string' && answer.text.length === 0) || !answer.text)
    && !answer.person_id && !answer.event_id && !answer.place_id
    && !answer.service_id) {
    return deleteAnswer(answer.id);
  }
  return KnowledgeAnswer.forge(answer).save(null, { method: 'update' })
    .then(data => options.returnJSON ? data.toJSON() : data)
    .catch(err => err);
};

export async function createPlace(place, organization, location, options) {
  const composedPlace = {
    name: place.name,
    brief_description: place.brief_description,
    description: place.description,
    eligibility_information: place.eligibility_information,
    phone_number: place.phone_number,
    url: place.url,
    organization_id: organization.id,
    availabilitys: place.availabilitys,
    functions: place.functions,
    alternate_names: place.alternate_names,
  };
  // Set Location
  if (location) {
    const locationJSON = await createLocation(location, { returnJSON: true });
    if (locationJSON) composedPlace.location_id = locationJSON.id;
  }
  return Place.forge(composedPlace).save(null, { method: 'insert' })
    .then(placeData => (options.returnJSON ? placeData.toJSON() : placeData))
    .catch(err => err);
}

export async function updatePlace(place, options) {
  const compiledPlace = {
    id: place.id,
    name: place.name,
    brief_description: place.brief_description,
    description: place.description,
    eligibility_information: place.eligibility_information,
    phone_number: place.phone_number,
    url: place.url,
    availabilitys: place.availabilitys,
    location_id: place.location_id,
    functions: place.functions,
    alternate_names: place.alternate_names,
  };
  // Create location if it was passed without an ID
  if (place.location && !place.location.id) {
    const locationJSON = await createLocation(place.location, { returnJSON: true });
    if (locationJSON) compiledPlace.location_id = locationJSON.id;
  }
  return Place.forge(compiledPlace).save(null, { method: 'update' })
    .then(placeData => (options.returnJSON ? placeData.toJSON() : placeData))
    .catch(err => err);
}

export const deletePlace = (placeId) => {
  return KnowledgeAnswer.where({ place_id: placeId }).destroy().then(() => {
    return Place.forge({ id: placeId }).destroy().then(() => {
      return { id: placeId };
    }).catch(err => err);
  }).catch(err => err);
};

export async function createService(service, organization, location, options) {
  const composedService = {
    name: service.name,
    brief_description: service.brief_description,
    description: service.description,
    phone_number: service.phone_number,
    url: service.url,
    organization_id: organization.id,
    availabilitys: service.availabilitys,
    functions: service.functions,
    alternate_names: service.alternate_names,
  };
  // Set Location
  if (location) {
    const locationJSON = await createLocation(location, { returnJSON: true });
    if (locationJSON) composedService.location_id = locationJSON.id;
  }
  return Service.forge(composedService).save(null, { method: 'insert' })
    .then(serviceData => (options.returnJSON ? serviceData.toJSON() : serviceData))
    .catch(err => err);
}

export async function updateService(service, options) {
  const compiledService = {
    id: service.id,
    name: service.name,
    brief_description: service.brief_description,
    description: service.description,
    eligibility_information: service.eligibility_information,
    phone_number: service.phone_number,
    url: service.url,
    availabilitys: service.availabilitys,
    location_id: service.location_id,
    functions: service.functions,
    alternate_names: service.alternate_names,
  };
  // Create location if it was passed without an ID
  if (service.location && !service.location.id) {
    const locationJSON = await createLocation(service.location, { returnJSON: true });
    if (locationJSON) compiledService.location_id = locationJSON.id;
  }
  return Service.forge(compiledService).save(null, { method: 'update' })
    .then(serviceData => (options.returnJSON ? serviceData.toJSON() : serviceData))
    .catch(err => err);
}

export const deleteService = (serviceId) => {
  return KnowledgeAnswer.where({ service_id: serviceId }).destroy().then(() => {
    return Service.forge({ id: serviceId }).destroy().then(() => {
      return { id: serviceId };
    }).catch(err => err);
  }).catch(err => err);
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

export const getPersons = (params, options = {}) => {
  return Person.where(params).fetchAll({ withRelated: ['knowledgeCategories'] })
    .then((data) => {
      return options.returnJSON ? data.toJSON() : data;
    }).catch(error => error);
};

export const createPerson = (data, options = {}) => {
  const person = {
    ...data.person,
    organization_id: data.organization.id,
  };
  return Person.forge(person)
    .save(null, { method: 'insert' })
    .then((personModel) => {
      return options.returnJSON ? personModel.toJSON() : personModel;
    }).catch(error => error);
};

export const updatePerson = (person, options = {}) => {
  const cleanedPerson = person;
  delete cleanedPerson.knowledgeCategories;
  return Person.where({ id: person.id })
    .save(cleanedPerson, { method: 'update' })
    .then((personModel) => {
      return options.returnJSON ? personModel.toJSON() : personModel;
    }).catch(error => error);
};

export const deletePerson = (person) => {
  return knex('knowledge_categorys_persons')
    .where('person_id', '=', person.id)
    .del().then(() => {
      return Person.where({ id: person.id }).destroy().then(() => {
        return {
          id: person.id,
        };
      }).catch(error => error);
    });
};

/**
 * Get knowledge base questions/answers as rows for a CSV
 * @param {Number} params.label
 * @param {Number} params.answered
 * @param {Object} params.shout_outs
 */
export function getQuestionsAsTable(params = {}) {
  const questionFilter = {};
  if (params.knowledge_category_id) {
    questionFilter.knowledge_category_id = params.knowledge_category_id;
  }
  return KnowledgeQuestion.where(questionFilter).fetchAll({
    withRelated: [{
      answers: q => q.where('organization_id', params.organization_id),
    }, 'category'],
  }).then((questionsCollection) => {
    const questionJSON = params.unanswered
      ? questionsCollection.toJSON().filter(q => q.answers.length === 0)
      : questionsCollection.toJSON();
    const finalResults = [];
    questionJSON.forEach((q) => {
      // Aborting Filters
      if (!q.label) return;
      if (q.label.includes('personality') || q.label.includes('search')) return
      if (params.shout_outs === 'false') {
        if (ShoutOuts.all[q.label]) return;
      } else if (params.shout_outs === 'true') {
        if (!ShoutOuts.all[q.label]) return;
      }
      // If has answers, do one thing
      let answer = null;
      if (q.answers && q.answers.length > 0) {
        const textAnswers = q.answers.filter(a => a.text);
        if (textAnswers.length === 1) {
          answer = textAnswers[0].text;
        }
      }
      const baseResult = { knowledge_question_id: q.id, question: q.question };
      if (params.label === 'true') baseResult.label = q.label;
      if (!params.hasOwnProperty('answered')) {
        finalResults.push({ ...baseResult, answer: answer || '' });
      } else if (params.hasOwnProperty('answered') && params.answered === 'false' && !answer) {
        finalResults.push({ ...baseResult, answer: '' });
      } else if (params.hasOwnProperty('answered') && params.answered === 'true' && answer) {
        finalResults.push({ ...baseResult, answer });
      }
    });
    return { rows: finalResults };
  });
}

export function createAnswersFromRows({ answers, organization }, options = { returnJSON: true }) {
  const headerPositions = {
    knowledge_question_id: null,
    question: null,
    answer: null,
  };
  answers[0].forEach((h, index) => {
    if (h === 'knowledge_question_id') {
      headerPositions.knowledge_question_id = index;
    } else if (h === 'question') {
      headerPositions.question = index;
    } else if (h === 'answer') {
      headerPositions.answer = index;
    }
  });
  if (headerPositions.knowledge_question_id == null) {
    throw new Error('Trouble identifying columns');
  }

  // TODO: Fix this query.
  // Everytime this promise runs, a kitten cries.
  // Tried doing batch inserts w/ unique table constraints but kept hitting edges
  const filteredRows = answers.slice(1)
    .filter(row => row[headerPositions.answer] != null && row[headerPositions.answer].length > 0)
    .map((row) => {
      const rowData = {
        organization_id: organization.id,
        knowledge_question_id: row[headerPositions.knowledge_question_id],
        text: row[headerPositions.answer],
      };
      return KnowledgeAnswer.where({
        organization_id: organization.id,
        knowledge_question_id: rowData.knowledge_question_id,
      }).fetchAll().then((results) => {
        const textResult = results.toJSON().filter(r => r.text);
        if (textResult.length > 0) {
          return KnowledgeAnswer.forge({ ...rowData, id: textResult[0].id })
            .save(null, { method: 'update' });
        }
        return KnowledgeAnswer.forge({ ...rowData })
          .save(null, { method: 'insert' });
      });
    });

  return Promise.all(filteredRows)
    .then(data => data)
    .catch(error => error);
}

export async function getCategoryFallback(labels, orgId) {
  const fallbackObj = {
    labels,
    organizationId: orgId,
  };
  const categoryFetches = [];
  labels.forEach((label) => {
    categoryFetches.push(KnowledgeCategory.where({ label })
      .fetch({
        withRelated: [{
          persons: q => q.where('persons.organization_id', '=', orgId),
          representatives: q => q.where('representatives.organization_id', '=', orgId),
        }],
      }).then(labelData => (labelData ? labelData.toJSON() : [])),
    );
  });
  let mergedPersons = [];
  let mergedRepresentatives = [];
  await Promise.all(categoryFetches).then((labelData) => {
    labelData.forEach((label) => {
      mergedPersons = mergedPersons.concat(label.persons || []);
      mergedRepresentatives = mergedRepresentatives.concat(label.representatives || []);
    });
  });
  // If no persons, look farther up
  if (mergedPersons.length === 0) {
    await KnowledgeCategory.where({ label: KNOWLEDGE_CONST.GENERAL_CATEGORY_LABEL }).fetch({
      withRelated: [{
        persons: q => q.where('persons.organization_id', '=', orgId),
      }],
    }).then((generalData) => {
      fallbackObj.labels = [KNOWLEDGE_CONST.GENERAL_CATEGORY_LABEL];
      fallbackObj.fellback = true;
      fallbackObj.persons = (generalData) ? generalData.toJSON().persons : [];
    });
  } else {
    fallbackObj.fellback = false;
    fallbackObj.persons = mergedPersons;
  }
  // If representatives were assigned, send them an email so we can get an answer
  fallbackObj.representatives = mergedRepresentatives;
  return fallbackObj;
}

export async function answerQuestion(organization, question, answers) {
  await knex('knowledge_answers').where({ organization_id: organization.id, knowledge_question_id: question.id }).del();
  const answerInserts = [];
  const idHash = {};
  answers.forEach((answer) => {
    // Make sure answer has valid values
    if (!Object.values(answer).length > 0) return;
    // If Action
    if (answer.actions) {
      const cleanedActions = Object.assign({}, answer.actions);
      const cleanedConfig = answer.actions.config;
      delete cleanedActions.config;
      answerInserts.push(knex('knowledge_answers').insert({
        organization_id: organization.id,
        knowledge_question_id: question.id,
        approved_at: null,
        actions: cleanedActions,
      }));
      if (answer.actions.shout_out && cleanedConfig) {
        answerInserts.push(knex('shout_out_triggers').where({ organization_id: organization.id, label: cleanedActions.shout_out }).del()
          .then(() => knex('shout_out_triggers').insert({
            organization_id: organization.id,
            label: cleanedActions.shout_out,
            config: cleanedConfig,
          })));
      }
    // Otherwise
    } else if ((answer.text && answer.text.length > 0) || !Object.keys(answer).includes('text')) {
      // Check each insert for duplicate entity IDs
      let answerDuplicate = false;
      if (!idHash[Object.keys(answer)[0]]) {
        idHash[Object.keys(answer)[0]] = [answer[Object.keys(answer)[0]]];
      } else if (idHash[Object.keys(answer)[0]].includes(answer[Object.keys(answer)[0]])) {
        answerDuplicate = true;
      } else {
        idHash[Object.keys(answer)[0]].push(answer[Object.keys(answer)[0]]);
      }
      if (!answerDuplicate) {
        answerInserts.push(knex('knowledge_answers').insert({
          ...answer,
          organization_id: organization.id,
          knowledge_question_id: question.id,
          approved_at: null,
        }));
      }
    }
  });
  // Send emails about new answers to admins
  const approvalReps = await Representative.where({ organization_id: organization.id, admin: true }).fetchAll()
    .then(r => r.toJSON()).filter(r => r.email)
    .map(r => ({ email: r.email, name: r.name }));
  new EmailService().send(`🤖 Answer Needs Approval - "${question.question}"`,
    `An employee has saved an answer for "${question.question}"! Please <a href="${env.getDashboardRoot()}/answer?organization_id=${organization.id}&knowledge_question_id=${question.id}" target="_blank">go approve it</a> so we can send it to constituents.<br/><br/>If you have questions, send <a href="mailto:mark@mayor.chat">us</a> an email!`,
    approvalReps,
  );
  // Conclude
  await Promise.all(answerInserts).then(r => r);
  return {
    question: await KnowledgeQuestion.where({ id: question.id }).fetch({ withRelated: ['answers'] }).then(q => q.toJSON()),
  };
}

export function approveAnswers(answers = []) {
  return Promise.all(answers.map((answer) => {
    return knex('knowledge_answers').where({ id: answer.id }).update({ approved_at: knex.raw('now()') }).returning('id');
  })).then(results => ({ answers: results }));
}

export async function lookupActiveVehicles(vehicleFunction, orgId, coordinates) {
  const params = {
    organization_id: orgId,
  };
  if (vehicleFunction) params.function = vehicleFunction;
  const vehicles = await Vehicle.query((qb) => {
    qb.where(params)
      .andWhere(knex.raw("DATE_PART('Day',now() - last_active_at::timestamptz) < 1"));
  }).fetchAll().then(v => v.toJSON());
  return {
    vehicles,
  };
}
