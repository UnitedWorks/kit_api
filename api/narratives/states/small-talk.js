import axios from 'axios';
import { logger } from '../../logger';
import * as TAGS from '../../constants/nlp-tagging';
import * as INTEGRATIONS from '../../constants/integrations';
import { nlp } from '../../services/nlp';
import { getAnswer } from '../../knowledge-base/helpers';
import { entityValueIs } from '../helpers';
import { hasIntegration } from '../../integrations/helpers';
import { getConstituentCases } from '../../cases/helpers';
import SlackService from '../../services/slack';

/* TODO(nicksahler) until I build the full i18n class */
const i18n = function(key) {
  var translations = {
    'intro_hello': 'Oh, hey there! I\'m the Mayor and I\'m here to help you engage with your city.',
    'intro_information': 'I\'ll tell you about school closings, benefits available to you, and how to get a dog license for that cute pup. Tell me the name of your city or postcode.'
  }

  return translations[key];
};

export default {
  init: {
    enter() {
      logger.info('State: Getting Started');

      this.messagingClient.addAll([
        i18n('intro_hello'),
        {
          type: 'image',
          url: 'https://scontent-lga3-1.xx.fbcdn.net/v/t31.0-8/16422989_187757401706018_5896478987148979475_o.png?oh=e1edeead1710b85f3d42e669685f3d59&oe=590603C2',
        },
        i18n('intro_information')
      ]);

      return this.messagingClient.runQuene().then(() => {
        return 'setup.waiting_organization';
      });
    }
  },

  whatCanIAsk() {
    const quickReplies = [
      { content_type: 'text', title: 'Upcoming Election', payload: 'Upcoming Election' },
      { content_type: 'text', title: 'Available Benefits', payload: 'Available Benefits' },
      { content_type: 'text', title: 'Raise an Issue', payload: 'MAKE_REQUEST' },
      { content_type: 'text', title: 'What can I ask?', payload: 'WHAT_CAN_I_ASK' },
    ];

    this.messagingClient.addToQuene({
      type: 'image',
      url: 'https://scontent-lga3-1.xx.fbcdn.net/v/t31.0-8/16463485_187743068374118_731666577286732253_o.png?oh=145d7d19e62113f3d2a56a74f1632d13&oe=590ABC31',
    });

    this.messagingClient.addToQuene('You can ask questions about all sorts of things like... "Where can I pay this parking ticket?," "Where can I get a dog license for this cute pup," and "When the next local election is coming up?"');

    if (this.get('organization').activated) {
      this.messagingClient.addToQuene('If you ask a question I can\'t answer, I\'ll let your city know! You can also send your city requests and complaints.', quickReplies);
    } else {
      this.messagingClient.addToQuene('Since your city hasn\'t signed up yet, I won\'t be able to answer every question for you :( I will be able to send your city requests and complaints though!', quickReplies);
    }
    return this.messagingClient.runQuene().then(() => 'start');
  },

// TODO: Move to init
  start: {
    message() {
      logger.info('State: Start');
      const input = this.snapshot.input.payload;
      return nlp.message(input.text, {}).then((nlpData) => {
        this.set('nlp', nlpData.entities);
        const entities = nlpData.entities;
        logger.info(nlpData);

        // Help
        if (entityValueIs(entities[TAGS.HELP], [TAGS.WHAT_CAN_I_ASK])) {
          return 'whatCanIAsk';

        // Benefits
        } else if (entities[TAGS.BENEFITS]) {
          return this.messagingClient.send('Benefit Kitchen can help you learn about state and federal programs. For now, visit their website: https://app.benefitkitchen.com/');

        // Voting
        } else if (entities[TAGS.VOTING]) {
          // Deadlines
          if (entityValueIs(entities[TAGS.VOTING], [TAGS.VOTING_DEADLINES])) return 'voting.votingDeadlines';
          // Elections
          if (entityValueIs(entities[TAGS.VOTING], [TAGS.LIST_ELECTIONS])) return 'voting.electionSchedule';
          // Registration
          if (entityValueIs(entities[TAGS.VOTING], [TAGS.REGISTER_TO_VOTE])) return 'voting.voterRegistrationGet';
          if (entityValueIs(entities[TAGS.VOTING], [TAGS.CHECK_VOTER_REGISTRATION])) return 'voting.voterRegistrationCheck';
          // Poll info
          if (entityValueIs(entities[TAGS.VOTING], [TAGS.POLL_INFO])) return 'voting.pollInfo';
          // Rules
          if (entityValueIs(entities[TAGS.VOTING], [TAGS.VOTER_ID])) return 'voting.voterIdRequirements';
          if (entityValueIs(entities[TAGS.VOTING], [TAGS.VOTER_ELIGIBILITY])) return 'voting.stateVotingRules';
          // Sample ballot
          if (entityValueIs(entities[TAGS.VOTING], [TAGS.SAMPLE_BALLOT])) return 'voting.sampleBallot';
          // Absentee ballot
          if (entityValueIs(entities[TAGS.VOTING], [TAGS.ABSENTEE_VOTE])) return 'voting.absenteeVote';
          // Early Voting
          if (entityValueIs(entities[TAGS.VOTING], [TAGS.EARLY_VOTING])) return 'voting.earlyVoting';
          // Problem
          if (entityValueIs(entities[TAGS.VOTING], [TAGS.VOTER_PROBLEM])) return 'voting.voterProblem';
          // FAQ/Help
          if (entityValueIs(entities[TAGS.VOTING], [TAGS.VOTER_ASSISTANCE])) return 'voting.voterAssistance';
          // Fallback
          return 'failedRequest';

        // Sanitation Services
        } else if (entities[TAGS.SANITATION]) {
          // Garbage
          if (entityValueIs(entities[TAGS.SANITATION], [TAGS.GARBAGE_SCHEDULE])) return 'sanitation.garbageSchedule';
          if (entityValueIs(entities[TAGS.SANITATION], [TAGS.GARBAGE_DROP_OFF])) return 'sanitation.garbageDropOff';
          // Recycling
          if (entityValueIs(entities[TAGS.SANITATION], [TAGS.RECYCLING_SCHEDULE])) return 'sanitation.recyclingSchedule';
          if (entityValueIs(entities[TAGS.SANITATION], [TAGS.RECYCLING_DROP_OFF])) return 'sanitation.recyclingDropOff';
          // Compost
          if (entityValueIs(entities[TAGS.SANITATION], [TAGS.COMPOST_DUMPING])) return 'sanitation.compostDumping';
          // Bulk Pickup
          if (entityValueIs(entities[TAGS.SANITATION], [TAGS.BULK_PICKUP])) return 'sanitation.bulkPickup';
          // Electronics
          if (entityValueIs(entities[TAGS.SANITATION], [TAGS.ELECTRONICS_DISPOSAL])) return 'sanitation.electronicsDisposal';
          // Fallback
          return 'failedRequest';

        // Human Services
        } else if (entities[TAGS.SOCIAL_SERVICES]) {
          const value = entities[TAGS.SOCIAL_SERVICES][0].value;
          // Shelter Search
          if (value === TAGS.SHELTER) {
            return hasIntegration(this.datastore.organization, INTEGRATIONS.ASK_DARCEL).then((integrated) => {
              if (integrated) {
                return axios.get('https://staging.askdarcel.org/api/resources', {
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
                  return this.messagingClient.runQuene().then(() => 'start');
                });
              } else {
                return getAnswer({
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
                  return 'start';
                });
              }
            });
          }
          if (value === TAGS.FOOD) { // Food Assistance
            return hasIntegration(this.datastore.organization, INTEGRATIONS.ASK_DARCEL).then((integrated) => {
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
                  return this.messagingClient.runQuene().then(() => 'start');
                });
              } else {
                return getAnswer({
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
                  return 'start';
                });
              }
            });
          }
          // Hygiene Services
          if (value === TAGS.HYGIENE) {
            return hasIntegration(this.datastore.organization, INTEGRATIONS.ASK_DARCEL).then((integrated) => {
              if (integrated) {
                return axios.get('https://staging.askdarcel.org/api/resources', {
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
                  return this.messagingClient.runQuene().then(() => 'start');
                });
              } else {
                return getAnswer({
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
                  return 'start';
                });
              }
            });
          }

        // Medical Services
        } else if (entities[TAGS.HEALTH]) {
          const value = entities[TAGS.HEALTH][0].value;
          // Clinics
          if (value === TAGS.CLINIC) {
            return hasIntegration(this.datastore.organization, INTEGRATIONS.ASK_DARCEL).then((integrated) => {
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
                  return this.messagingClient.runQuene().then(() => 'start');
                });
              } else {
                return getAnswer({
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
                  return 'start';
                });
              }
            });
          }

        // Employment Services
        } else if (entities[TAGS.EMPLOYMENT]) {
          const value = entities[TAGS.EMPLOYMENT][0].value;
          // Employment Asssistance
          if (value === TAGS.JOB_TRAINING) {
            return hasIntegration(this.datastore.organization, INTEGRATIONS.ASK_DARCEL).then((integrated) => {
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
                  return this.messagingClient.runQuene().then(() => 'start');
                });
              } else {
                return getAnswer({
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
                  return 'start';
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
                return 'setup.reset_organization';
              }
            }
          }

        // Relationships
        } else if (entities[TAGS.RELATIONSHIPS]) {

        // Complaint
        } else if (entities[TAGS.COMPLAINT]) {
          if (entities[TAGS.TRANSACTION]) {
            return 'getRequests';
          } else {
            return 'complaint.waiting_for_complaint';
          }

        // Failed to Understand Request
        } else {
          return 'failedRequest';
        }
      });
    },

    action() {
      return {
        'MAKE_REQUEST': 'complaint.init',
        'GET_REQUESTS': 'getRequests',
        'GET_STARTED': 'init',
        'CHANGE_CITY': 'setup.reset_organization',
        'WHAT_CAN_I_ASK': 'whatCanIAsk',
      }[this.snapshot.input.payload.payload];
    }
  },

  getRequests() {
    return getConstituentCases(this.snapshot.constituent).then(({ cases }) => {
      cases.forEach((thisCase) => {
        const message = `${thisCase.status.toUpperCase()} - ${thisCase.title.length > 48 ? thisCase.title.slice(0, 45).concat('...') : thisCase.title} (#${thisCase.id})`;
        this.messagingClient.addToQuene(message);
      });
      return this.messagingClient.runQuene().then(() => 'start');
    });
  },

  failedRequest(aux = {}) {
    new SlackService({
      username: 'Misunderstood Request',
      icon: 'question',
    }).send(`>*Request Message*: ${aux.input.payload.text}\n>*Constituent ID*: ${this.snapshot.constituent.id}`);
    const message = 'Ah shoot, I\'m still learning so I don\'t understand that request yet. Can you give more description? <3';
    this.messagingClient.send(message);
    return 'start';
  },
};
