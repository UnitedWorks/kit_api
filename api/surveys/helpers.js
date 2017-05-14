import { knex } from '../orm';
import * as SurveyModels from './models';
import Clients from '../conversations/clients';
import { NarrativeSession } from '../narratives/models';

export function getSurvey(params, options = { returnJSON: true }) {
  return SurveyModels.Survey.where(params)
    .fetch({ withRelated: ['questions'] })
    .then((surveyModel) => {
      return options.returnJSON ? surveyModel.toJSON() : surveyModel;
    }).catch(err => err);
}

export function getSurveys(params, options = { returnJSON: true }) {
  return SurveyModels.Survey.where(params)
    .fetchAll({ withRelated: ['questions'] })
    .then((surveyModels) => {
      return options.returnJSON ? surveyModels.toJSON() : surveyModels;
    }).catch(err => err);
}

export function createSurvey({ survey, questions = [], organization }, options = { returnJSON: true }) {
  return SurveyModels.Survey.forge({ ...survey, organization_id: organization.id })
    .save(null, { method: 'insert' })
    .then((newSurveyModel) => {
      if (questions.length > 0) {
        const modifiedQuestions = questions.map((question, index) => {
          return SurveyModels.SurveyQuestion.forge(Object.assign(question, {
            position: index,
            survey_id: newSurveyModel.get('id'),
          })).save(null, { method: 'insert' });
        });
        return Promise.all(modifiedQuestions)
          .then((newQuestionModels) => {
            return options.returnJSON ? Object.assign(newSurveyModel.toJSON(), {
              questions: newQuestionModels.toJSON(),
            }) : { survey: newSurveyModel.toJSON(), questions: newQuestionModels.toJSON() };
          }).catch(err => err);
      }
      return options.returnJSON ? newSurveyModel.toJSON() : newSurveyModel;
    }).catch(err => err);
}

export function updateSurvey(surveyProps, options = { returnJSON: true }) {
  if (!surveyProps.id) throw new Error('No Survey ID provided');
  return SurveyModels.Survey.where({ id: surveyProps.id })
    .save(surveyProps, { method: 'update' })
    .then((updatedModel) => {
      return options.returnJSON ? updatedModel.toJSON() : updatedModel;
    }).catch((err) => {
      throw new Error(err);
    });
}

export function deleteSurvey({ id }) {
  return SurveyModels.SurveyQuestion.where({ survey_id: id })
    .fetchAll({ withRelated: 'answers' })
    .then((questionModels) => {
      const destroyAnswers = [];
      questionModels.models.forEach((model) => {
        destroyAnswers.push(model.related('answers').invokeThen('destroy'));
      });
      // Destroy Answers
      return Promise.all(destroyAnswers).then(() => {
        // Destroy Questions
        return questionModels.invokeThen('destroy').then(() => {
          // Destroy Survey
          return SurveyModels.Survey.forge({ id }).destroy().then(() => {
            return { id };
          }).catch(err => err);
        }).catch(err => err);
      }).catch(err => err);
    }).catch(err => err);
}

const acceptanceQuickReplies = [
  { content_type: 'text', title: 'Ok!', payload: 'Ok!' },
  { content_type: 'text', title: 'No thanks', payload: 'No thanks' },
];

export function broadcastSurvey(survey = {}) {
  if (!survey.id) throw new Error('No Survey ID provided');
  return SurveyModels.Survey.where({ id: survey.id }).fetch({ withRelated: ['questions'] })
    .then((foundSurvey) => {
      return NarrativeSession.where({ organization_id: foundSurvey.get('organization_id') })
        .fetchAll({ withRelated: ['constituent', 'constituent.facebookEntry', 'constituent.smsEntry'] })
        .then((sessions) => {
          const message = `Hey there! Do you have a moment to help me with a quick survey, "${foundSurvey.get('name')}"?`;
          sessions.models.forEach((session) => {
            // Set state to waiting for acceptance
            session.save({
              state_machine_name: 'survey',
              state_machine_current_state: 'waiting_for_acceptance',
              data_store: Object.assign(session.get('data_store'), {
                survey: foundSurvey.toJSON(),
              }),
            }).then(() => {
              // Send Message
              if (session.related('constituent').get('facebook_id')) {
                new Clients.FacebookMessengerClient({
                  constituent: session.related('constituent').toJSON(),
                }).send(message, acceptanceQuickReplies);
              } else if (session.related('constituent').get('phone')) {
                new Clients.TwilioSMSClient({
                  constituent: session.related('constituent').toJSON(),
                }).send(message, acceptanceQuickReplies);
              }
            });
          });
        }).catch(err => err);
    }).catch(err => err);
}

export function saveSurveyAnswers(questions, constituent) {
  const answersToForge = [];
  questions.forEach((question) => {
    answersToForge.push(SurveyModels.SurveyAnswer.forge({
      constituent_id: constituent.id,
      survey_question_id: question.id,
      response: question.answer,
    }).save());
  });
  return Promise.all(answersToForge).then((data) => {
    return data;
  }).catch(error => error);
}

export function getSurveyAnswers(params, options = { returnJSON: true }) {
  if (!params.id) throw new Error('No survey id');
  return knex.raw(`SELECT replace(lower(survey_questions.prompt), ' ', '_') AS prompt, survey_answers.constituent_id AS constituent_id, survey_answers.response->>'text' AS response
    FROM survey_answers
    LEFT JOIN survey_questions ON survey_answers.survey_question_id = survey_questions.id
    WHERE survey_questions.survey_id = ${params.id}
  `).then((data) => {
    // One day we'll be able to use crosstabview and wont need to do any mutations funk
    // \crosstabview constituent_id prompt response;
    const answerDataHash = {};
    data.rows.forEach((row) => {
      if (!answerDataHash[row.constituent_id]) {
        answerDataHash[row.constituent_id] = {};
      }
      answerDataHash[row.constituent_id][row.prompt] = row.response;
    });
    const finalFormat = [];
    Object.keys(answerDataHash).forEach((id) => {
      const constituentObj = {
        constituent_id: id,
      };
      Object.keys(answerDataHash[id]).forEach((key) => {
        constituentObj[key] = answerDataHash[id][key];
      });
      finalFormat.push(constituentObj);
    });
    return { rows: finalFormat };
  });
};
