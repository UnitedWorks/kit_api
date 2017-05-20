import { nlp } from '../../services/nlp';
import { createConstituentCase, addCaseNote } from '../../cases/helpers';
import { getSurvey, saveSurveyAnswers } from '../../surveys/helpers';
import * as CASE_CONSTANTS from '../../constants/cases';
import * as SURVEY_CONSTANTS from '../../constants/surveys';

const acceptanceQuickReplies = [
  { content_type: 'text', title: 'Yes', payload: 'Yes' },
  { content_type: 'text', title: 'No thanks', payload: 'No thanks' },
];

const locationQuickReply = {
  content_type: 'location',
};

export default {
  loading_survey: {
    enter() {
      const label = this.snapshot.nlp.entities ?
        this.snapshot.nlp.entities.intent[0].value : 'general_complaint';
      return getSurvey({ label }).then((survey) => {
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
      return nlp.message(this.snapshot.input.payload.text).then((nlpData) => {
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
          const quickReplies = [];
          if (questions[i].type === SURVEY_CONSTANTS.LOCATION) {
            quickReplies.push(locationQuickReply);
          }
          return this.messagingClient.send(
            this.snapshot.data_store.survey.questions[i].prompt, quickReplies);
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
              pictures: this.snapshot.input.payload.attachments ?
                this.snapshot.input.payload.attachments : null,
            };
          } else if (questions[i].type === SURVEY_CONSTANTS.LOCATION) {
            newQuestions[i].answer = {
              location: this.snapshot.input.payload.attachments ?
                this.snapshot.input.payload.attachments[0] : null,
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
    message() {
      // Backup incase an error was thrown and state didnt resolve from enter()
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
      const caseId = this.get('survey').case_id;
      const description = questions.filter(q => q.type === SURVEY_CONSTANTS.TEXT)[0].answer.text;
      const pictureQuestions = questions.filter(q => q.type === SURVEY_CONSTANTS.PICTURE);
      let pictures;
      if (pictureQuestions.length > 0) {
        pictures = pictureQuestions[0].answer.pictures;
      }
      const locationQuestions = questions.filter(q => q.type === SURVEY_CONSTANTS.LOCATION);
      let location;
      if (locationQuestions.length > 0) {
        location = locationQuestions[0].answer.location;
      }
      let query;
      // If ID exists, update case rather than create new
      if (caseId) {
        query = addCaseNote(caseId, `Q: ${title} -- A: ${description} `);
      } else {
        // Create New
        query = createConstituentCase({
          title,
          description,
          type: CASE_CONSTANTS.REQUEST,
          location,
          attachments: pictures,
        },
        this.snapshot.constituent,
        this.get('organization') || { id: this.snapshot.organization_id,
        });
      }
      return query.then(() => {
        this.messagingClient.send('I\'ve sent your message along and will keep you updated!');
        this.delete('survey');
        this.snapshot.state_machine_name = 'smallTalk';
        this.current = 'start';
        this.save();
      });
    },
  },

};
