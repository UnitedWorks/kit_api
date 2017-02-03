import axios from 'axios';
import { logger } from '../../logger';
import * as TAGS from '../../constants/nlp-tagging';
import * as SOURCES from '../../constants/narrative-sources';
import { PRIMARY_CATEGORIES as PRIMARY_CASE_CATEGORIES } from '../../constants/case-categories';
import { NarrativeStoreMachine } from './state';
import { nlp } from '../../services/nlp';
import { geocoder } from '../../services/geocoder';
import { Constituent, Organization } from '../../accounts/models';
import { createOrganization, getAdminOrganizationAtLocation } from '../../accounts/helpers';
import { getAnswer, saveLocation } from '../../knowledge-base/helpers';
import { createCase } from '../../cases/helpers';
import { CaseCategory } from '../../cases/models';
import { hasSource } from './helpers';
import SlackService from '../../services/slack';

const smallTalkStates = {
  init() {
  },

  intro() {
    logger.info('State: Getting Started');
    this.messagingClient.addToQuene('Oh, hey there! I\'m the Mayor and I\'m here to help you engage your city.');
    this.messagingClient.addToQuene(null, {
      type: 'image',
      url: 'https://scontent-lga3-1.xx.fbcdn.net/v/t31.0-8/16422989_187757401706018_5896478987148979475_o.png?oh=e1edeead1710b85f3d42e669685f3d59&oe=590603C2',
    });
    this.messagingClient.addToQuene('I\'ll tell you about school closings, available benefits, and help you get a dog license for that cute pup. Tell me the name of your city or postcode.');
    this.messagingClient.runQuene().then(() => {
      this.exit('setOrganization');
    });
  },

  setOrganization(aux) {
    logger.info('State: Set Organization');
    // If menu action, simply pose question
    if (aux && aux.menuAction) {
      this.messagingClient.send('Ok! Tell me the city name or postcode.');
      this.exit('setOrganization');
      return;
    }
    //
    // Get input, process it, and get a geolocation
    //
    const input = this.get('input').payload.text || this.get('input').payload.payload;
    nlp.message(input, {}).then((nlpData) => {
      // If no location is recognized by NLP, request again
      if (!Object.prototype.hasOwnProperty.call(nlpData.entities, 'location')) {
        this.messagingClient.send('Sorry, did you say a city or state? Can you tell me what city, state, and zipcode you\'re from?');
        this.exit('setOrganization');
      }
      geocoder.geocode(nlpData.entities.location[0].value).then((geoData) => {
        // If more than one location is matched with our geolocation look up, ask for detail
        const filteredGeoData = geoData.filter(location => location.city);
        if (filteredGeoData.length > 1) {
          const quickReplies = filteredGeoData.map((location) => {
            const formattedText = `${location.city}, ${location.administrativeLevels.level1short}`;
            return {
              content_type: 'text',
              title: formattedText,
              payload: formattedText,
            };
          });
          this.messagingClient.send(`Hmm, which ${nlpData.entities.location[0].value} are you?`, null, quickReplies);
          this.exit('setOrganization');
          return;
        } else if (filteredGeoData.length === 0) {
          this.messagingClient.send('Hmm, I can\'t find that city, can you try again?');
          this.exit('setOrganization');
          return;
        }
        //
        // Match with Organization
        //
        this.set('nlp', nlpData.entities);
        this.set('location', filteredGeoData[0]);
        const constituentLocation = this.get('location');

        getAdminOrganizationAtLocation(constituentLocation).then((orgModel) => {
          this.set('organization', orgModel);
          if (!orgModel.activated) {
            new SlackService({
              username: 'Inactive City Requested',
              icon: 'round_pushpin',
            }).send(`>*City Requested*: ${orgModel.name}\n>*ID*: ${orgModel.id}`);
          }
          this.fire('setOrganizationConfirm', null, { locationText: `${orgModel.city}, ${orgModel.administrative_levels.level1short}` });
        }).catch(() => {
          saveLocation(constituentLocation).then((locationModel) => {
            createOrganization({
              name: locationModel.get('city'),
              category: 'public',
              type: 'admin',
              location_id: locationModel.get('id'),
            }).then((orgModel) => {
              this.set('organization', orgModel);
              new SlackService({
                username: 'Unregistered City',
                icon: 'round_pushpin',
              }).send(`>*City Requested*: ${orgModel.get('name')}\n>*ID*: ${orgModel.get('id')}`);
              this.fire('setOrganizationConfirm', null, { locationText: `${orgModel.location.city}, ${orgModel.location.administrativeLevels.level1short}` });
            });
          });
        });
      }).catch(logger.error);
    }).catch(logger.error);
  },

  setOrganizationConfirm(aux) {
    logger.info('State: Set Organization Confirmation');
    if (aux) {
      const quickReplies = [
        { content_type: 'text', title: 'Yep!', payload: 'Yep!' },
        { content_type: 'text', title: 'No', payload: 'No' },
      ];
      this.messagingClient.send(`Oh, ${aux.locationText}? Is that the right city?`, null, quickReplies);
      this.exit('setOrganizationConfirm');
    } else {
      const input = this.get('input').payload.text || this.get('input').payload.payload;
      nlp.message(input, {}).then((nlpData) => {
        if (nlpData.entities.confirm_deny[0].value === 'Yes') {
          this.messagingClient.addToQuene('Oh yeah? Some of the best mayors are around there. Including me of course.');
          // If city is activated, suggest asking a question or complaint
          // If not, tell them they can only leave complaints/suggestions!
          const quickReplies = [
            { content_type: 'text', title: 'What can I ask?', payload: 'WHAT_CAN_I_ASK' },
            { content_type: 'text', title: 'Make a Request', payload: 'MAKE_REQUEST' },
          ];
          if (this.get('organization').activated) {
            this.messagingClient.addToQuene('Your community is among the best! It looks like they\'ve given me answers to some common questions and requests.', null, quickReplies);
          } else {
            this.messagingClient.addToQuene('You\'re community hasn\'t yet given me answers to common questions, but I\'ve let them know. They can still accept requests, suggestions, or complaints!', null, quickReplies);
          }
          this.messagingClient.runQuene().then(() => {
            this.exit('start');
          });
        } else if (nlpData.entities.confirm_deny[0].value === 'No') {
          this.messagingClient.send('Oh! Can you tell me your city and state again?');
          this.exit('setOrganization');
        } else {
          this.messagingClient.send('Sorry, I didn\'t catch whether that was correct.');
          this.exit('setOrganizationConfirm');
        }
      });
    }
  },

  whatCanIAsk() {
    this.messagingClient.addToQuene(null, {
      type: 'image',
      url: 'https://scontent-lga3-1.xx.fbcdn.net/v/t31.0-8/16463485_187743068374118_731666577286732253_o.png?oh=145d7d19e62113f3d2a56a74f1632d13&oe=590ABC31',
    });
    this.messagingClient.addToQuene('You can ask questions about all sorts of things like... "Where can I pay this parking ticket?", "Where can I get a dog license for this cute pup", and "When the next local election is coming up?"');
    if (this.get('organization').activated) {
      this.messagingClient.addToQuene('Your city is active, so if you ask a question I can\'t asnwer, I\'ll let them know! You can also leave requests and complaints.');
    } else {
      this.messagingClient.addToQuene('However, your city has not yet signed up, so I won\'t be able to answer questions for you. I can however forward along complaints or suggestions you have!');
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
      if (Object.prototype.hasOwnProperty.call(entities, TAGS.HELP)) {
        if (entities[TAGS.HELP][0].value === TAGS.WHAT_CAN_I_ASK) {
          this.fire('whatCanIAsk');
        }
      // Complaint
      } else if (Object.prototype.hasOwnProperty.call(entities, TAGS.COMPLAINT)) {
        if (Object.prototype.hasOwnProperty.call(entities, TAGS.TRANSACTION)) {
          this.fire('getRequests');
        } else {
          this.fire('complaintStart');
        }
      // Sanitation Services
      } else if (Object.prototype.hasOwnProperty.call(entities, TAGS.SANITATION)) {
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
        } else if (Object.prototype.hasOwnProperty.call(entities, TAGS.SCHEDULES)) {
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
      } else if (Object.prototype.hasOwnProperty.call(entities, TAGS.SOCIAL_SERVICES)) {
        const value = entities[TAGS.SOCIAL_SERVICES][0].value;
        const orgSources = this.datastore.organization.narrativeSources;
        // Shelter Search
        if (value === TAGS.SHELTER) {
          if (hasSource(orgSources, SOURCES.ASKDARCEL)) {
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
        }
        if (value === TAGS.FOOD) { // Food Assistance
          if (hasSource(orgSources, SOURCES.ASKDARCEL)) {
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
        }
        // Hygiene Services
        if (value === TAGS.HYGIENE) {
          if (hasSource(orgSources, SOURCES.ASKDARCEL)) {
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
        }
      // Medical Services
      } else if (Object.prototype.hasOwnProperty.call(entities, TAGS.HEALTH)) {
        const value = entities[TAGS.HEALTH][0].value;
        const orgSources = this.datastore.organization.narrativeSources;
        // Clinics
        if (value === TAGS.CLINIC) {
          if (hasSource(orgSources, SOURCES.ASKDARCEL)) {
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
        }
      // Employment Services
      } else if (Object.prototype.hasOwnProperty.call(entities, TAGS.EMPLOYMENT)) {
        const value = entities[TAGS.EMPLOYMENT][0].value;
        const orgSources = this.datastore.organization.narrativeSources;
        // Employment Asssistance
        if (value === TAGS.JOB_TRAINING) {
          if (hasSource(orgSources, SOURCES.ASKDARCEL)) {
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
        }
      } else if (Object.prototype.hasOwnProperty.call(entities, TAGS.TRANSACTION)) {
        const transaction = entities[TAGS.TRANSACTION][0].value;
        if (transaction === TAGS.CHANGE) {
          if (Object.prototype.hasOwnProperty.call(entities, TAGS.ADMINISTRATION)) {
            const administration = entities[TAGS.ADMINISTRATION][0].value;
            if (administration === TAGS.CITY) {
              this.fire('location', null, { previous: 'start' });
            }
          }
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
    Constituent.where({ id: this.snapshot.constituent.id }).fetch({ withRelated: ['cases'] }).then((constituentModel) => {
      constituentModel.toJSON().cases.forEach((constituentCase) => {
        const message = `#${constituentCase.id} (${constituentCase.status}) - ${constituentCase.title.length > 24 ? constituentCase.title.slice(0, 21).concat('...') : constituentCase.title}`;
        this.messagingClient.addToQuene(constituentModel.toJSON(), message);
      });
      this.messagingClient.runQuene();
    });
  },

  complaintStart(aux = {}) {
    const quickReplies = PRIMARY_CASE_CATEGORIES.map((label) => {
      return {
        content_type: 'text',
        title: label,
        payload: label,
      };
    });
    this.messagingClient.send(aux.message || 'What type of problem do you have?', null, quickReplies).then(() => {
      this.exit('complaintCategory');
    });
  },

  complaintCategory() {
    // Check for text answer or passed quick_reply payload
    const category = this.get('input').payload.text || this.get('input').payload.payload;
    CaseCategory.where({ parent_category_id: null }).fetchAll().then((data) => {
      let foundModel;
      let generalModel;
      data.models.forEach((model) => {
        if (model.get('label') === 'General') generalModel = model.toJSON();
        if (model.get('label') === category) foundModel = model.toJSON();
      });
      const complaint = { category: foundModel || generalModel };
      this.set('complaint', complaint);
      this.messagingClient.send('Can you describe the problem for me?');
      this.exit('complaintText');
    });
  },

  complaintText() {
    const headline = this.get('input').payload.text;
    if (headline) {
      this.set('complaint', Object.assign({}, this.get('complaint'), { headline }));
      this.messagingClient.send('Can you provide a picture? If not, simply say you don\'t have one');
      this.exit('complaintPicture');
    }
  },

  complaintPicture() {
    const payload = this.get('input').payload;
    if (payload.attachments) {
      this.messagingClient.send('Thank you!');
      const updatedComplaint = Object.assign({}, this.get('complaint'), {
        attachments: payload.attachments,
      });
      this.set('complaint', updatedComplaint);
    }
    this.messagingClient.send('Can you send your location? That can simply be an address or a pin on the map.');
    this.exit('complaintLocation');
  },

  complaintLocation() {
    const payload = this.get('input').payload;
    if (payload.attachments) {
      const updatedComplaint = Object.assign({}, this.get('complaint'), {
        location: {
          latitude: payload.attachments[0].payload.coordinates.lat,
          longitude: payload.attachments[0].payload.coordinates.long,
        },
      });
      this.set('complaint', updatedComplaint);
      this.fire('complaintSubmit');
    } else if (payload.text) {
      geocoder.geocode(payload.text).then((geoData) => {
        const updatedComplaint = Object.assign({}, this.get('complaint'), {
          location: geoData[Object.keys(geoData)[0]],
        });
        this.set('complaint', updatedComplaint);
        this.fire('complaintSubmit');
      });
    } else {
      this.fire('complaintSubmit');
    }
  },

  complaintSubmit() {
    const complaint = this.get('complaint');
    createCase(complaint.headline, complaint.data, complaint.category, this.snapshot.constituent, this.get('organization'), complaint.location, complaint.attachments).then(() => {
      this.messagingClient.send('I just sent your message along. I\'ll try to let you know when it\'s been addressed.');
      this.exit('start');
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
          self.fire('setOrganization', null, { menuAction: true });
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
