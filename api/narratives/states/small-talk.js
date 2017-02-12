import axios from 'axios';
import { logger } from '../../logger';
import * as TAGS from '../../constants/nlp-tagging';
import * as INTEGRATIONS from '../../constants/integrations';
import { nlp } from '../../services/nlp';
import { NarrativeStoreMachine } from './state';
import { getAnswer } from '../../knowledge-base/helpers';
import { hasIntegration, hasEntityValue } from './helpers';
import SlackService from '../../services/slack';
import { states as complaintStates } from './complaint-states';
import { states as votingStates } from './voting-states';
import { states as setUpStates } from './setup-states';

const smallTalkStates = {

  ...complaintStates,
  ...votingStates,
  ...setUpStates,

  init() {
  },

  intro() {
    logger.info('State: Getting Started');
    this.messagingClient.addToQuene('Oh, hey there! I\'m the Mayor and I\'m here to help you engage with your city.');
    this.messagingClient.addToQuene(null, {
      type: 'image',
      url: 'https://scontent-lga3-1.xx.fbcdn.net/v/t31.0-8/16422989_187757401706018_5896478987148979475_o.png?oh=e1edeead1710b85f3d42e669685f3d59&oe=590603C2',
    });
    this.messagingClient.addToQuene('I\'ll tell you about school closings, benefits available to you, and how to get a dog license for that cute pup. Tell me the name of your city or postcode.');
    this.messagingClient.runQuene().then(() => {
      this.exit('setOrganization');
    });
  },

  whatCanIAsk() {
    const quickReplies = [
      { content_type: 'text', title: 'Make a Request!', payload: 'MAKE_REQUEST' },
    ];
    this.messagingClient.addToQuene(null, {
      type: 'image',
      url: 'https://scontent-lga3-1.xx.fbcdn.net/v/t31.0-8/16463485_187743068374118_731666577286732253_o.png?oh=145d7d19e62113f3d2a56a74f1632d13&oe=590ABC31',
    });
    this.messagingClient.addToQuene('You can ask questions about all sorts of things like... "Where can I pay this parking ticket?," "Where can I get a dog license for this cute pup," and "When the next local election is coming up?"');
    if (this.get('organization').activated) {
      this.messagingClient.addToQuene('If you ask a question I can\'t answer, I\'ll let your city know! You can also send your city requests and complaints.', null, quickReplies);
    } else {
      this.messagingClient.addToQuene('Since your city hasn\'t signed up yet, I won\'t be able to answer every question for you :( I will be able to send your city requests and complaints though!', null, quickReplies);
    }
    this.messagingClient.runQuene();
    this.exit('start');
  },

  start() {
    logger.info('State: Start');
    const input = this.get('input').payload;
    nlp.message(input.text, {}).then((nlpData) => {
      this.set('nlp', nlpData.entities);
      const entities = nlpData.entities;
      logger.info(nlpData);

      // Help
      if (hasEntityValue(entities[TAGS.HELP], [TAGS.WHAT_CAN_I_ASK])) {
        this.fire('whatCanIAsk');

      // Voting
      } else if (entities[TAGS.VOTING]) {
        // Deadlines
        if (hasEntityValue(entities[TAGS.VOTING], [TAGS.ELECTION])) {
          if (hasEntityValue(entities[TAGS.SCHEDULES], [TAGS.DEADLINE])) {
            this.fire('electionDeadlines');
          } else if (hasEntityValue(entities[TAGS.SCHEDULES], [TAGS.WHEN, TAGS.SCHEDULES])) {
            this.fire('electionSchedule');
          }
        }
        if (hasEntityValue(entities[TAGS.VOTING], [TAGS.EARLY_VOTING])) {
          this.fire('earlyVoting');
        }
        if (hasEntityValue(entities[TAGS.VOTING], [TAGS.POLLS])) {
          if (hasEntityValue(entities[TAGS.LOOKING_FOR], [TAGS.WHERE])) {
            this.fire('pollLocations');
          } else if (hasEntityValue(entities[TAGS.SCHEDULES], [TAGS.WHEN])) {
            this.fire('pollSchedule');
          }
        }
        // Registration
        if (hasEntityValue(entities[TAGS.VOTING], [TAGS.VOTER_REGISTRATION])) {
          if (hasEntityValue(entities[TAGS.TRANSACTION], [TAGS.CHECK])) {
            this.fire('voterRegistrationCheck');
          } else {
            this.fire('voterRegistrationGet');
          }
        }
        // Absentee ballot (absentee ballot)
        if (hasEntityValue(entities[TAGS.VOTING], [TAGS.ABSENTEE_BALLOT])) {
          this.fire('absenteeBallot');
        }
        // FAQ/Help
        if (entities[TAGS.HELP]) {
          this.fire('electionHelp');
        }

      // Sanitation Services
      } else if (entities[TAGS.SANITATION]) {
        const value = entities[TAGS.SANITATION][0].value;
        let answerRequest;
        if (value === TAGS.COMPOST) {
          // Request Compost Dumping
          answerRequest = getAnswer({
            label: 'sanitation-compost',
            organization_id: this.get('organization').id,
          }, { withRelated: false, returnJSON: true });
        } else if (value === TAGS.BULK) {
          // Request Bulk Pickup
          answerRequest = getAnswer({
            label: 'sanitation-bulk-pickup',
            organization_id: this.get('organization').id,
          }, { withRelated: false, returnJSON: true });
        } else if (value === TAGS.ELECTRONICS) {
          // Request Electronics
          answerRequest = getAnswer({
            label: 'sanitation-electronics-disposal',
            organization_id: this.get('organization').id,
          }, { withRelated: false, returnJSON: true });
        } else if (entities[TAGS.SCHEDULES]) {
          switch (value) {
            // Request Garbage
            case TAGS.GARBAGE:
              answerRequest = getAnswer({
                label: 'sanitation-garbage-schedule',
                organization_id: this.get('organization').id,
              }, { withRelated: false, returnJSON: true });
              break;
            // Request Recycling
            case TAGS.RECYCLING:
              answerRequest = getAnswer({
                label: 'sanitation-recycling-schedule',
                organization_id: this.get('organization').id,
              }, { withRelated: false, returnJSON: true });
              break;
            default:
          }
        }
        // Handle
        if (answerRequest) {
          answerRequest.then((payload) => {
            let message;
            if (payload.answer) {
              const answer = payload.answer;
              message = answer.url ? `${answer.text} (More info at ${answer.url})` : `${answer.text}`;
            } else {
              message = `Unfortunately, I can't answer that for your city (${this.get('organization').name}).`;
            }
            this.messagingClient.send(message);
            this.exit('start');
          });
        }

      // Human Services
      } else if (entities[TAGS.SOCIAL_SERVICES]) {
        const value = entities[TAGS.SOCIAL_SERVICES][0].value;
        // Shelter Search
        if (value === TAGS.SHELTER) {
          hasIntegration(this.datastore.organization, INTEGRATIONS.ASK_DARCEL).then((integrated) => {
            if (integrated) {
              axios.get('https://staging.askdarcel.org/api/resources', {
                params: {
                  category_id: 1,
                  lat: this.get('location').latitude,
                  long: this.get('location').longitude,
                },
              }).then((response) => {
                const body = response.data;
                const resources = body.resources;
                const counter = resources.length > 5 ? 5 : resources.length;
                this.messagingClient.addToQuene('Here are some places we\'ve found close to your location:\n');
                for (let i = counter; i > 0; i -= 1) {
                  const resource = resources[i];
                  this.messagingClient.addToQuene(`${resource.name}\n${resource.phones[0] ? `${resource.phones[0].number}\n` : ''}${resource.website ? `${resource.website}\n` : ''}${resource.short_description || resource.long_description || ''}\n`.trim());
                }
                this.messagingClient.runQuene();
              });
            } else {
              getAnswer({
                label: 'social-services-shelters',
                organization_id: this.get('organization').id,
              }, { withRelated: true, returnJSON: true }).then((payload) => {
                let message;
                if (payload.answer) {
                  const answer = payload.answer;
                  message = answer.url ? `${answer.text} (More info at ${answer.url})` : `${answer.text}`;
                } else {
                  message = 'I\'m sorry. I can\'t find anything in our database. I\'m going to let the city know about your need.';
                }
                this.messagingClient.send(message);
              });
            }
          });
        }
        if (value === TAGS.FOOD) { // Food Assistance
          hasIntegration(this.datastore.organization, INTEGRATIONS.ASK_DARCEL).then((integrated) => {
            if (integrated) {
              axios.get('https://staging.askdarcel.org/api/resources', {
                params: {
                  category_id: 2,
                  lat: this.get('location').latitude,
                  long: this.get('location').longitude,
                },
              }).then((response) => {
                const body = response.data;
                const resources = body.resources;
                const counter = resources.length > 5 ? 5 : resources.length;
                this.messagingClient.addToQuene('Here are some places we\'ve found close to your location:\n');
                for (let i = counter; i > 0; i -= 1) {
                  const resource = resources[i];
                  this.messagingClient.addToQuene(`${resource.name}\n${resource.phones[0] ? `${resource.phones[0].number}\n` : ''}${resource.website ? `${resource.website}\n` : ''}${resource.short_description || resource.long_description || ''}\n`.trim());
                }
                this.messagingClient.runQuene();
              });
            } else {
              getAnswer({
                label: 'social-services-food-assistance',
                organization_id: this.get('organization').id,
              }, { withRelated: true, returnJSON: true }).then((payload) => {
                let message;
                if (payload.answer) {
                  const answer = payload.answer;
                  message = answer.url ? `${answer.text} (More info at ${answer.url})` : `${answer.text}`;
                } else {
                  message = 'I\'m sorry. I can\'t find anything in our database. I\'m going to let the city know about your need.';
                }
                this.messagingClient.send(message);
                this.exit('start');
              });
            }
          });
        }
        // Hygiene Services
        if (value === TAGS.HYGIENE) {
          hasIntegration(this.datastore.organization, INTEGRATIONS.ASK_DARCEL).then((integrated) => {
            if (integrated) {
              axios.get('https://staging.askdarcel.org/api/resources', {
                params: {
                  category_id: 4,
                  lat: this.get('location').latitude,
                  long: this.get('location').longitude,
                },
              }).then((response) => {
                const body = response.data;
                const resources = body.resources;
                const counter = resources.length > 5 ? 5 : resources.length;
                this.messagingClient.addToQuene('Here are some places we\'ve found close to your location:\n');
                for (let i = counter; i > 0; i -= 1) {
                  const resource = resources[i];
                  this.messagingClient.addToQuene(`${resource.name}\n${resource.phones[0] ? `${resource.phones[0].number}\n` : ''}${resource.website ? `${resource.website}\n` : ''}${resource.short_description || resource.long_description || ''}\n`.trim());
                }
                this.messagingClient.runQuene();
              });
            } else {
              getAnswer({
                label: 'social-services-hygiene',
                organization_id: this.get('organization').id,
              }, { withRelated: true, returnJSON: true }).then((payload) => {
                let message;
                if (payload.answer) {
                  const answer = payload.answer;
                  message = answer.url ? `${answer.text} (More info at ${answer.url})` : `${answer.text}`;
                } else {
                  message = 'I\'m sorry. I can\'t find anything in our database. I\'m going to let the city know about your need.';
                }
                this.messagingClient.send(message);
                this.exit('start');
              });
            }
          });
        }

      // Medical Services
      } else if (entities[TAGS.HEALTH]) {
        const value = entities[TAGS.HEALTH][0].value;
        // Clinics
        if (value === TAGS.CLINIC) {
          hasIntegration(this.datastore.organization, INTEGRATIONS.ASK_DARCEL).then((integrated) => {
            if (integrated) {
              axios.get('https://staging.askdarcel.org/api/resources', {
                params: {
                  category_id: 3,
                  lat: this.get('location').latitude,
                  long: this.get('location').longitude,
                },
              }).then((response) => {
                const body = response.data;
                const resources = body.resources;
                const counter = resources.length > 5 ? 5 : resources.length;
                this.messagingClient.addToQuene('Here are some places we\'ve found close to your location:\n');
                for (let i = counter; i > 0; i -= 1) {
                  const resource = resources[i];
                  this.messagingClient.addToQuene(`${resource.name}\n${resource.phones[0] ? `${resource.phones[0].number}\n` : ''}${resource.website ? `${resource.website}\n` : ''}${resource.short_description || resource.long_description || ''}\n`.trim());
                }
                this.messagingClient.runQuene();
              });
            } else {
              getAnswer({
                label: 'health-clinic',
                organization_id: this.get('organization').id,
              }, { withRelated: true, returnJSON: true }).then((payload) => {
                let message;
                if (payload.answer) {
                  const answer = payload.answer;
                  message = answer.url ? `${answer.text} (More info at ${answer.url})` : `${answer.text}`;
                } else {
                  message = 'I\'m sorry. I can\'t find anything in our database. I\'m going to let the city know about your need.';
                }
                this.messagingClient.send(message);
                this.exit('start');
              });
            }
          });
        }

      // Employment Services
      } else if (entities[TAGS.EMPLOYMENT]) {
        const value = entities[TAGS.EMPLOYMENT][0].value;
        // Employment Asssistance
        if (value === TAGS.JOB_TRAINING) {
          hasIntegration(this.datastore.organization, INTEGRATIONS.ASK_DARCEL).then((integrated) => {
            if (integrated) {
              axios.get('https://staging.askdarcel.org/api/resources', {
                params: {
                  category_id: 5,
                  lat: this.get('location').latitude,
                  long: this.get('location').longitude,
                },
              }).then((response) => {
                const body = response.data;
                const resources = body.resources;
                const counter = resources.length > 5 ? 5 : resources.length;
                this.messagingClient.addToQuene('Here are some places we\'ve found close to your location:\n');
                for (let i = counter; i > 0; i -= 1) {
                  const resource = resources[i];
                  this.messagingClient.addToQuene(`${resource.name}\n${resource.phones[0] ? `${resource.phones[0].number}\n` : ''}${resource.website ? `${resource.website}\n` : ''}${resource.short_description || resource.long_description || ''}\n`.trim());
                }
                this.messagingClient.runQuene();
              });
            } else {
              getAnswer({
                label: 'employment-job-training',
                organization_id: this.get('organization').id,
              }, { withRelated: true, returnJSON: true }).then((payload) => {
                let message;
                if (payload.answer) {
                  const answer = payload.answer;
                  message = answer.url ? `${answer.text} (More info at ${answer.url})` : `${answer.text}`;
                } else {
                  message = 'I\'m sorry. I can\'t find anything in our database. I\'m going to let the city know about your need.';
                }
                this.messagingClient.send(message);
                this.exit('start');
              });
            }
          });
        }
      } else if (entities[TAGS.TRANSACTION]) {
        const transaction = entities[TAGS.TRANSACTION][0].value;
        if (transaction === TAGS.CHANGE) {
          if (entities[TAGS.ADMINISTRATION]) {
            const administration = entities[TAGS.ADMINISTRATION][0].value;
            if (administration === TAGS.CITY) {
              this.fire('setOrganization', null, { freshStart: true });
            }
          }
        }

      // Relationships
      } else if (entities[TAGS.RELATIONSHIPS]) {
        console.log('relationships route hit')

      // Complaint
      } else if (entities[TAGS.COMPLAINT]) {
        if (entities[TAGS.TRANSACTION]) {
          this.fire('getRequests');
        } else {
          this.fire('complaintStart');
        }

      } else {
        new SlackService({
          username: 'Misunderstood Request',
          icon: 'question',
        }).send(`>*Request Message*: ${input.text}\n>*Constituent ID*: ${this.snapshot.constituent.id}`);
        this.messagingClient.send('I\'m not sure I understanding. Can you try phrase that differently?');
        this.exit('start');
      }
    });
  },

  getRequests() {
    getConstituentCases(this.snapshot.constituent).then(({ cases }) => {
      cases.forEach((thisCase) => {
        const message = `${thisCase.status.toUpperCase()} - ${thisCase.title.length > 48 ? thisCase.title.slice(0, 45).concat('...') : thisCase.title} (#${thisCase.id})`;
        this.messagingClient.addToQuene(message);
      });
      this.messagingClient.runQuene().then(() => {
        this.exit('start');
      });
    });
  },
};

export default class SmallTalkMachine extends NarrativeStoreMachine {
  constructor(appSession, snapshot) {
    super(appSession, snapshot, smallTalkStates);
    const self = this;

    // Handlers
    function handleMessage() {
      if (typeof self.snapshot.state_machine_current_state !== 'string' && typeof self.snapshot.organization_id !== 'string') {
        self.fire('intro');
      } else if (self.current) {
        self.fire(self.current);
      } else {
        self.fire('start');
      }
    }

    function handleAction() {
      switch (self.snapshot.data_store.input.payload.payload) {
        case 'MAKE_REQUEST':
          self.fire('complaintStart');
          return true;
        case 'GET_REQUESTS':
          self.fire('getRequests');
          return true;
        case 'GET_STARTED':
          self.fire('intro');
          return true;
        case 'CHANGE_CITY':
          self.fire('setOrganization', null, { freshStart: true });
          return true;
        case 'WHAT_CAN_I_ASK':
          self.fire('whatCanIAsk');
          return true;
        default:
          return false;
      }
    }

    // Initialize
    const actionType = self.snapshot.data_store.input.type;
    switch (actionType) {
      case 'message':
        handleMessage();
        break;
      case 'action':
        const checkForAction = handleAction();
        if (!checkForAction) {
          handleMessage();
        }
        break;
    }
  }
}
