import { nlp } from '../../services/nlp';
import { createConstituentCase } from '../../cases/helpers';
import { getSurvey } from '../../surveys/helpers';

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
    enter() {
      return this.messagingClient.send('Hey there! Mind if I ask you a few questions?', acceptanceQuickReplies);
    },
    message() {
      return nlp.message(this.snapshot.input.payload.text, {}).then((nlpData) => {
        this.snapshot.nlp = nlpData;
        const entities = nlpData.entities;
        if (entities.intent && entities.intent[0]) {
          if (entities.intent[0].value === 'speech_confirm') {
            return this.messagingClient.send('Great! :)').then(() => 'waiting_for_answer');
          }
          if (entities.intent[0].value === 'speech_deny') {
            return this.messagingClient.send('No problem!').then(() => 'smallTalk.start');
          }
          return this.messagingClient.send('Sorry, didn\'t catch that. Want to do the survey?', acceptanceQuickReplies);
        }
      });
    },
  },

  waiting_for_answer: {
    enter() {
    },
    message() {
    },
  },

  concluding_survey: {
    enter() {
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
        return 'smallTalk.start';
      });
    },
  },

};
