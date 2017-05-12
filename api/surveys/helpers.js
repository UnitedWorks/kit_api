import * as SurveyModels from './models';

export const getSurvey = (params, options = { returnJSON: true }) => {
  return SurveyModels.Survey.where(params)
    .fetch({ withRelated: ['questions'] })
    .then((surveyModel) => {
      return options.returnJSON ? surveyModel.toJSON() : surveyModel;
    }).catch(err => err);
};

export const getSurveys = (params, options = { returnJSON: true }) => {
  return SurveyModels.Survey.where(params)
    .fetchAll({ withRelated: ['questions'] })
    .then((surveyModels) => {
      return options.returnJSON ? surveyModels.toJSON() : surveyModels;
    }).catch(err => err);
};

export const createSurvey = ({ survey, questions = [], organization }, options = { returnJSON: true }) => {
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
};

export const updateSurvey = (surveyProps, options = { returnJSON: true }) => {
  return SurveyModels.Survey.where({ id: surveyProps.id })
    .save(surveyProps, { method: 'update' })
    .then((updatedModel) => {
      return options.returnJSON ? updatedModel.toJSON() : updatedModel;
    }).catch(err => err);
};

export const deleteSurvey = ({ id }) => {
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
};
