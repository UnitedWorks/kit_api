import axios from 'axios';
import { logger } from '../../logger';
import * as TAGS from '../../constants/nlp-tagging';
import * as SOURCES from '../../constants/narrative-sources';
import { PRIMARY_CATEGORIES as PRIMARY_CASE_CATEGORIES } from '../../constants/case-categories';
import { NarrativeStoreMachine } from './state';
import { nlp } from '../../services/nlp';
import { geocoder } from '../../services/geocoder';
import { Constituent, Organization } from '../../accounts/models';
import { createOrganization } from '../../accounts/helpers';
import { getAnswer, saveLocation } from '../../knowledge-base/helpers';
import { createCase } from '../../cases/helpers';
import { CaseCategory } from '../../cases/models';
import { hasSource } from './helpers';
import SlackService from '../../services/slack';

const smallTalkStates = {
  init() {
  },

  gettingStarted() {
    logger.info('State: Getting Started');
    this.messagingClient.addToQuene('Hey there! I\'m the Mayor');
    this.messagingClient.addToQuene('Sort of... Truthfully, I\'m an AI bot that helps you connect with the city and your community');
    this.messagingClient.addToQuene('I can tell you the trash schedule, report potholes, or try and help with any problems or injustices you\'re facing.');
    this.messagingClient.runQuene().then(() => {
      this.fire('location', null, { previous: 'gettingStarted' });
    });
  },

  location(aux = {}) {
    logger.info('State: Location');
    const input = this.get('input').payload;
    if (Object.prototype.hasOwnProperty.call(aux, 'previous')) {
      switch (aux.previous) {
        case 'gettingStarted':
          this.messagingClient.send('But before I can help out, what city and state do you live in?');
          this.exit('location');
          break;
        default:
          this.messagingClient.send('Which city do you want to connect to and get info from?');
          this.exit('location');
          break;
      }
    } else {
      nlp.message(input.text, {}).then((nlpData) => {
        if (!Object.prototype.hasOwnProperty.call(nlpData.entities, 'location')) {
          this.messagingClient.send('Sorry, I didn\'t catch that. What city or state?');
          this.exit('location');
          return;
        }
        geocoder.geocode(nlpData.entities.location[0].value).then((geoData) => {
          this.set('nlp', nlpData.entities);
          this.set('location', geoData[Object.keys(geoData)[0]]);
          const numberOfLocations = Object.keys(geoData).length;
          if (numberOfLocations > 1) {
            const message = `Did you mean ${geoData['0'].formattedAddress}? If not, give a bit more detail.`;
            this.messagingClient.send(message);
            this.exit('location');
          } else if (numberOfLocations === 1) {
            this.set('location', geoData[0]);
            this.fire('setOrganization');
          } else {
            const message = this.previous !== 'location' ? 'What city are you located in?' : 'Hmm, I`m not familiar with that city. I might need a state or zipcode.';
            this.messagingClient.send(message);
            this.exit('location');
          }
        }).catch(logger.info);
      }).catch(logger.info);
    }
  },

  setOrganization() {
    logger.info('State: Set Organization');
    // When a geolocation is found for the user, see if a matching city is found for an organization
    // I think this function should be improved to require administrative level matching
    const constituentLocation = this.get('location');
    Organization.collection().fetch({ withRelated: ['location', 'narrativeSources'] }).then((collection) => {
      let cityFound = false;
      collection.toJSON().forEach((organizationModel) => {
        if (organizationModel.location.city === constituentLocation.city) {
          this.set('organization', organizationModel);
          const message = organizationModel.activated ?
            `Got it! I'll make sure my answers relate to ${constituentLocation.city}. Where were we?` :
            'Oh no! Your city isn\'t registered. I can still take complaints, but may not have all the answers to your questions.';
          if (!organizationModel.activated) {
            new SlackService({
              username: 'Inactive City Requested',
              icon: 'round_pushpin',
            }).send(`>*City Requested*: ${organizationModel.name}\n>*ID*: ${organizationModel.id}`);
          }
          this.messagingClient.send(message);
          this.exit('start');
          cityFound = true;
        }
      });
      if (!cityFound) {
        saveLocation(constituentLocation).then((locationModel) => {
          createOrganization({
            name: locationModel.get('city'),
            category: 'public',
            type: 'admin',
            location_id: locationModel.get('id'),
          }).then((organizationModel) => {
            this.set('organization', organizationModel);
            new SlackService({
              username: 'Unregistered City',
              icon: 'round_pushpin',
            }).send(`>*City Requested*: ${organizationModel.get('name')}\n>*ID*: ${organizationModel.get('id')}`);
            this.messagingClient.send('Oh no! Your city isn\'t registered. I will let them know you\'re interested and do my best to help you.');
            this.exit('start');
          });
        });
      }
    });
  },

  start() {
    logger.info('State: Start');
    const input = this.get('input').payload;
    nlp.message(input.text, {}).then((nlpData) => {
      this.set('nlp', nlpData.entities);
      const entities = nlpData.entities;
      logger.info(nlpData);

      // Complaint
      if (Object.prototype.hasOwnProperty.call(entities, TAGS.COMPLAINT)) {
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
        self.fire('gettingStarted');
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
          break;
        case 'GET_REQUESTS':
          self.fire('getRequests');
          break;
        case 'GET_STARTED':
          self.fire('gettingStarted');
          break;
        case 'CHANGE_CITY':
          self.fire('location', null, { previous: self.current || self.previous });
          break;
      }
    }

    // Initialize
    const actionType = self.snapshot.data_store.input.type;
    switch (actionType) {
      case 'message':
        handleMessage();
        break;
      case 'action':
        handleAction();
        break;
      default:
    }
  }
}
