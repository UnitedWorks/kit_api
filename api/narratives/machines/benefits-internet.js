import { logger } from '../../logger';
import { nlp } from '../../services/nlp';
import BenefitKitchen from '../clients/benefit-kitchen'

export default {
  init: {
    enter() {
      this.set('benefits', {});
      return this.messagingClient.send('I\'m going to ask you some basic questions to see if you are eligible for high speed internet').then(()=>'calculate');
    }
  },

  start: {
    message() {
      return 'init';
    }
  },

  waiting_monthly_income: {
    enter() {
      this.messagingClient.send('What is your monthly income in dollars?');
    },

    message() {
      this.get('benefits')['monthly_income'] = Number.parseInt(this.snapshot.input.payload.text);
      return 'calculate';
    }
  },

  waiting_family_size: {
    enter() {
      this.messagingClient.send('How many people are in your household?');

    },

    message() {
      this.get('benefits')['family_size'] = Number.parseInt(this.snapshot.input.payload.text);
      return 'calculate';
    }
  },

  waiting_food_stamps: {
    enter() {
      this.messagingClient.send('Do you use foodstamps? How many?');
    },
    message() {
      this.get('benefits')['food_stamps'] =  Number.parseInt(this.snapshot.input.payload.text);
      return 'calculate';
    }
  },

  waiting_school_lunch: {
    enter() {
      const quickReplies = [
        { content_type: 'text', title: 'Yep!', payload: 'Yep!' },
        { content_type: 'text', title: 'No', payload: 'No' },
      ];

      this.messagingClient.send('Do you get free school lunch?', quickReplies);
    },

    message() {
      return nlp.message(this.snapshot.input.payload).then((nlpData) => {
        this.get('benefits')['school_lunch'] = (nlpData.entities.intent && nlpData.entities.intent[0].value === 'speech_confirm') ? 'yes' : 'no ';
        return 'calculate';
      });
    }
  },

  waiting_lifeline: {
    enter() {
      this.get('benefits')['lifeline'] = 9.25; //this.snapshot.input.payload;
      return 'calculate';
    }
  },


  calculate() {
    let self = this;

    if (!this.get('benefits')['monthly_income']) return 'waiting_monthly_income';
    if (!this.get('benefits')['family_size']) return 'waiting_family_size';
    if (!this.get('benefits')['food_stamps']) return 'waiting_food_stamps';
    //if (!this.get('benefits')['school_lunch']) return 'waiting_school_lunch';
    //if (!this.get('benefits')['lifeline']) return 'waiting_lifeline';

    this.get('benefits')['live_zip'] = this.get('location')['zipcode'];


    return (new BenefitKitchen()).getInternetEligibility(this.get('benefits')).then((response)=> {
      response.data.map((m, i)=>{
        logger.info(m);
        self.messagingClient.addToQuene(`You ${(i > 0)? 'Also' : ''} qualify for ${m.ProviderName} which costs ${m.Cost}` + ((m.SetUpFee)?` and costs ${m.SetUpFee} to set up.`:'.'));

        self.messagingClient.addToQuene({
          type: 'template',
          templateType: 'list',
          buttons: [{
            type: 'web_url',
            title: m.ButtonText,
            url: m.Url,
            webview_height_ratio: 'tall'
          }]
        });

      });

      return self.messagingClient.runQuene().then(()=>'smallTalk.start');
    }).catch((e)=> {
      this.messagingClient.send("There was a problem calculating your benefits!");
      logger.error(e);
      return 'smallTalk.start';
    });
  }
};
