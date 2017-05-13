import { nlp } from '../../services/nlp';
import { createConstituentCase } from '../../cases/helpers';
import { getSurvey, saveSurveyAnswers } from '../../surveys/helpers';
import * as CASE_CONSTANTS from '../../constants/cases';

const acceptanceQuickReplies = [
  { content_type: 'text', title: 'Sure!', payload: 'Sure!' },
  { content_type: 'text', title: 'No thanks', payload: 'No thanks' },
];

export default {
  loading_survey: {
    enter(aux) {
      return getSurvey({ label: aux.label }).then((survey) => {
        console.log('//////')
        console.log(survey)
        console.log('//////')
        // this.set('survey', survey);
        return 'waiting_for_answer';
      });
    },
  },

  waiting_for_acceptance: {
    enter(aux = {}) {
      return this.messagingClient.send(aux.message || 'Hey there! Mind if I ask you a few questions?', acceptanceQuickReplies);
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
            return this.messagingClient.send('No problem!').then(() => 'smallTalk.start');
          }
        }
        return this.messagingClient.send('Sorry, didn\'t catch that. Want to do the survey?', acceptanceQuickReplies);
      });
    },
  },

  waiting_for_answer: {
    enter() {
      if (!this.snapshot.data_store.survey) return 'smallTalk.start';
      for (let i = 0; i < this.snapshot.data_store.survey.questions.length; i += 1) {
        if (this.snapshot.data_store.survey.questions[i].answer === undefined) {
          return this.messagingClient.send(this.snapshot.data_store.survey.questions[i].prompt);
        }
      }
      return 'concluding_survey';
    },
    message() {
      if (!this.snapshot.data_store.survey) return 'smallTalk.start';
      for (let i = 0; i < this.snapshot.data_store.survey.questions.length; i += 1) {
        if (this.snapshot.data_store.survey.questions[i].answer === undefined) {
          const newQuestions = this.snapshot.data_store.survey.questions;
          newQuestions[i].answer = {
            text: this.snapshot.input.payload.text,
          };
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
    create_case() {
      const complaint = this.get('complaint');
      return createConstituentCase({
        title: complaint.title,
        type: CASE_CONSTANTS.REQUEST,
        category: complaint.category,
        location: complaint.location,
        attachments: complaint.attachments,
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
    enter() {
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
  },

};
