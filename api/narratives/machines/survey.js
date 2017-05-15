import { nlp } from '../../services/nlp';
import { createConstituentCase } from '../../cases/helpers';
import { getSurvey, saveSurveyAnswers } from '../../surveys/helpers';
import * as CASE_CONSTANTS from '../../constants/cases';
import * as SURVEY_CONSTANTS from '../../constants/surveys';

const acceptanceQuickReplies = [
  { content_type: 'text', title: 'Yes', payload: 'Yes' },
  { content_type: 'text', title: 'No thanks', payload: 'No thanks' },
];

export default {
  loading_survey: {
    enter(aux = {}) {
      const label = this.snapshot.nlp.entities.intent[0].value;
      if (!label && !aux.id) return 'smallTalk.failedRequest';
      return getSurvey({ id: aux.id, label }).then((survey) => {
        if (!survey) return 'smallTalk.failedRequest';
        this.set('survey', survey);
        return 'waiting_for_answer';
      });
    },
  },

  waiting_for_acceptance: {
    enter(aux = {}) {
      return this.messagingClient.send(aux.message || `I can help you with ${`"${this.get('survey').name}"` || 'this'}, but I need to ask a few questions. Want to continue?`, acceptanceQuickReplies);
    },
    message() {
      return nlp.message(this.snapshot.input.payload.text, {}).then((nlpData) => {
        this.snapshot.nlp = nlpData;
        const entities = nlpData.entities;
        if (entities.intent && entities.intent[0]) {
          if (entities.intent.filter(i => i.value === 'speech_confirm').length > 0) {
            return this.messagingClient.send('Great! :)').then(() => 'waiting_for_answer');
          }
          if (entities.intent.filter(i => i.value === 'speech_deny').length > 0) {
            this.delete('survey');
            return this.messagingClient.send('Ok! No problem.').then(() => 'smallTalk.start');
          }
        }
        return this.messagingClient.send('Sorry, didn\'t catch that. Want to do the survey?', acceptanceQuickReplies);
      });
    },
  },

  waiting_for_answer: {
    enter() {
      if (!this.snapshot.data_store.survey) return 'smallTalk.start';
      const questions = this.snapshot.data_store.survey.questions;
      if (!questions) {
        this.delete('survey');
        return 'smallTalk.start';
      }
      for (let i = 0; i < questions.length; i += 1) {
        if (questions[i].answer === undefined) {
          return this.messagingClient.send(this.snapshot.data_store.survey.questions[i].prompt);
        }
      }
      return 'concluding_survey';
    },
    message() {
      if (!this.snapshot.data_store.survey) return 'smallTalk.start';
      const questions = this.snapshot.data_store.survey.questions;
      if (!questions) {
        this.delete('survey');
        return 'smallTalk.start';
      }
      for (let i = 0; i < questions.length; i += 1) {
        if (questions[i].answer === undefined) {
          const newQuestions = this.snapshot.data_store.survey.questions;
          if (questions[i].type === SURVEY_CONSTANTS.TEXT) {
            newQuestions[i].answer = {
              text: this.snapshot.input.payload.text,
            };
          } else if (questions[i].type === SURVEY_CONSTANTS.PICTURE) {
            newQuestions[i].answer = {
              pictures: this.snapshot.input.payload.attachments ? this.snapshot.input.payload.attachments : null,
            };
          } else if (questions[i].type === SURVEY_CONSTANTS.LOCATION) {
            newQuestions[i].answer = {
              location: this.snapshot.input.payload.attachments ? this.snapshot.input.payload.attachments[0] : null,
            };
          }
          const newSurveyStore = this.get('survey');
          newSurveyStore.questions = newQuestions;
          this.set('survey', newSurveyStore);
          break;
        }
      }
      this.input('enter');
    },
  },

  concluding_survey: {
    enter() {
      this.input(this.get('survey').concluding_action || 'default');
    },
    default() {
      this.messagingClient.send('Great, those were all my questions. Thank you so much!');
      return saveSurveyAnswers(this.snapshot.data_store.survey.questions, this.snapshot.constituent)
        .then(() => {
          this.delete('survey');
          // Not sure why, but when I was doing a fire, it wasn't saving the new state and machine.
          this.snapshot.state_machine_name = 'smallTalk';
          this.current = 'start';
          this.save();
        });
    },
    create_case() {
      const questions = this.get('survey').questions;
      const title = this.get('survey').name;
      const description = questions.filter(q => q.type === SURVEY_CONSTANTS.TEXT)[0].answer.text;
      const pictures = questions.filter(q => q.type === SURVEY_CONSTANTS.PICTURE)[0].answer.pictures;
      const location = questions.filter(q => q.type === SURVEY_CONSTANTS.LOCATION)[0].answer.location;
      return createConstituentCase({
        title,
        description,
        type: CASE_CONSTANTS.REQUEST,
        location,
        attachments: pictures,
      },
      this.snapshot.constituent,
      this.get('organization') || { id: this.snapshot.organization_id,
      }).then(() => {
        this.messagingClient.send('I just sent your message along. I\'ll try to let you know when it\'s been addressed.');
        this.delete('survey');
        this.snapshot.state_machine_name = 'smallTalk';
        this.current = 'start';
        this.save();
      });
    },
  },

};
