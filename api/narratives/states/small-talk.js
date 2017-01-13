import axios from 'axios';
import { logger } from '../../logger';
import { NarrativeStoreMachine } from './state';
import { nlp } from '../../services/nlp';
import { geocoder } from '../../services/geocoder';
import { Organization } from '../../accounts/models';
import * as TAGS from '../../constants/nlp-tagging';
import * as SOURCES from '../../constants/narrative-sources';
import { getAnswers } from '../../knowledge-base/helpers';
import { hasSource } from './helpers';
import SlackService from '../../services/slack';
import EmailService from '../../services/email';

const smallTalkStates = {
  init() {
  },

  gettingStarted() {
    logger.info('State: Getting Started');
    this.messagingClient.send(this.snapshot.constituent, 'Hey there! I\'m the Mayor').then(() => {
      this.messagingClient.send(this.snapshot.constituent, 'Sort of... Truthfully, I\'m an AI bot that helps you connect with the city and your community').then(() => {
        this.messagingClient.send(this.snapshot.constituent, 'I can tell you the trash schedule, report potholes, or try and help with any problems or injustices you\'re facing.').then(() => {
          this.fire('location', null, { previous: 'gettingStarted' });
        });
      });
    });
  },

  location(aux = {}) {
    logger.info('State: Location');
    const input = this.get('input').payload;
    if (aux.hasOwnProperty('previous')) {
      switch (aux.previous) {
        case 'gettingStarted':
          this.messagingClient.send(this.snapshot.constituent, 'But before I can help out, what city and state do you live in?');
          this.exit('location');
          break;
        default:
          this.messagingClient.send(this.snapshot.constituent, 'Which city do you want to connect to and get info from?');
          this.exit('location');
          break;
      }
    } else {
      nlp.message(input.text, {}).then((nlpData) => {
        geocoder.geocode(nlpData.entities.location[0].value).then((geoData) => {
          this.set('nlp', nlpData.entities);
          this.set('location', geoData[Object.keys(geoData)[0]]);
          const numberOfLocations = Object.keys(geoData).length;
          if (numberOfLocations > 1) {
            const message = `Did you mean ${geoData['0'].formattedAddress}? If not, give a bit more detail.`;
            this.messagingClient.send(this.snapshot.constituent, message);
            this.exit('location');
          } else if (numberOfLocations === 1) {
            this.set('location', geoData[0]);
            this.fire('setOrganization');
          } else {
            const message = this.previous !== 'location' ? 'What city are you located in?' : 'Hmm, I`m not familiar with that city. I might need a state or zipcode.';
            this.messagingClient.send(this.snapshot.constituent, message);
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
      collection.toJSON().forEach((document) => {
        if (document.location.city === constituentLocation.city) {
          this.set('organization', document);
          const message = `Got it! I'll make sure my answers relate to ${constituentLocation.city}. Where were we?`;
          this.messagingClient.send(this.snapshot.constituent, message);
          this.exit('start');
          cityFound = true;
        }
      });
      if (!cityFound) {
        this.messagingClient.send(this.snapshot.constituent, 'Oh no! Your city isn\'t registered. I will let them know you\'re interested.');
        this.exit('start');
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

      if (entities.hasOwnProperty(TAGS.COMPLAINT)) { // Complaint
        this.fire('complaintStart');
      } else if (entities.hasOwnProperty(TAGS.SANITATION)) { // Sanitation Services
        const value = entities[TAGS.SANITATION][0].value;
        let answerRequest;
        if (value === TAGS.COMPOST) {
          // Request Compost Dumping
          answerRequest = getAnswers({}, {
            label: 'sanitation-compost',
            organization_id: this.get('organization').id,
          }, { withRelated: false });
        } else if (value === TAGS.BULK) {
          // Request Bulk Pickup
          answerRequest = getAnswers({}, {
            label: 'sanitation-bulk-pickup',
            organization_id: this.get('organization').id,
          }, { withRelated: false });
        } else if (value === TAGS.ELECTRONICS) {
          // Request Electronics
          answerRequest = getAnswers({}, {
            label: 'sanitation-electronics-disposal',
            organization_id: this.get('organization').id,
          }, { withRelated: false });
        } else if (entities.hasOwnProperty(TAGS.SCHEDULES)) {
          switch (value) {
            // Request Garbage
            case TAGS.GARBAGE:
              answerRequest = getAnswers({}, {
                label: 'sanitation-garbage-schedule',
                organization_id: this.get('organization').id,
              }, { withRelated: false });
              break;
            // Request Recycling
            case TAGS.RECYCLING:
              answerRequest = getAnswers({}, {
                label: 'sanitation-recycling-schedule',
                organization_id: this.get('organization').id,
              }, { withRelated: false });
              break;
            default:
              break;
          }
        }
        // Handle
        if (answerRequest) {
          answerRequest.then((payload) => {
            const answer = payload.toJSON()[0];
            if (answer) {
              const message = answer.url ? `${answer.answer} (More info at ${answer.url})` : `${answer.answer}`;
              this.messagingClient.send(this.snapshot.constituent, message);
            } else {
              this.messagingClient.send(this.snapshot.constituent, 'Unfortunately, I don\'t have an answer for that');
            }
            this.exit('start');
          });
        }
      } else if (entities.hasOwnProperty(TAGS.SOCIAL_SERVICES)) { // Human Services
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
              const counter = resources.length > 3 ? 3 : resources.length;
              let message = 'Here are some shelters we\'ve found in your city: \n\n';
              for (let i = counter; i > 0; i -= 1) {
                const resource = resources[i];
                message += `${resource.name} \n ${resource.website} \n ${resource.short_description || resource.long_description || ''} \n\n`;
              }
              this.messagingClient.send(this.snapshot.constituent, message);
            });
          } else {
            getAnswers({}, {
              label: 'social-services-shelters',
              organization_id: this.get('organization').id,
            }, { withRelated: true }).then((payload) => {
              const answer = payload.toJSON()[0];
              let message;
              if (payload.length === 0) {
                message = 'I\'m sorry. I can\'t find anything in our database. I\'m going to let the city know about your need.';
              } else {
                message = answer.url ? `${answer.answer} (More info at ${answer.url})` : `${answer.answer}`;
              }
              this.messagingClient.send(this.snapshot.constituent, message);
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
              const counter = resources.length > 3 ? 3 : resources.length;
              let message = 'Here is what we\'ve found in your city: \n\n';
              for (let i = counter; i > 0; i -= 1) {
                const resource = resources[i];
                message += `${resource.name} \n ${resource.website} \n ${resource.short_description || resource.long_description || ''} \n\n`;
              }
              this.messagingClient.send(this.snapshot.constituent, message);
            });
          } else {
            getAnswers({}, {
              label: 'social-services-food-assistance',
              organization_id: this.get('organization').id,
            }, { withRelated: true }).then((payload) => {
              const answer = payload.toJSON()[0];
              let message;
              if (payload.length === 0) {
                message = 'I\'m sorry. I can\'t find anything in our database. I\'m going to let the city know about your need.';
              } else {
                message = answer.url ? `${answer.answer} (More info at ${answer.url})` : `${answer.answer}`;
              }
              this.messagingClient.send(this.snapshot.constituent, message);
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
              const counter = resources.length > 2 ? 2 : resources.length;
              let message = 'Here are some places we\'ve found close to your location: \n\n';
              for (let i = counter; i > 0; i -= 1) {
                const resource = resources[i];
                message += `${resource.name} \n ${resource.website} \n ${resource.short_description || resource.long_description || ''} \n\n`;
              }
              this.messagingClient.send(this.snapshot.constituent, message);
            });
          } else {
            getAnswers({}, {
              label: 'social-services-hygiene',
              organization_id: this.get('organization').id,
            }, { withRelated: true }).then((payload) => {
              const answer = payload.toJSON()[0];
              let message;
              if (payload.length === 0) {
                message = 'I\'m sorry. I can\'t find anything in our database. I\'m going to let the city know about your need.';
              } else {
                message = answer.url ? `${answer.answer} (More info at ${answer.url})` : `${answer.answer}`;
              }
              this.messagingClient.send(this.snapshot.constituent, message);
              this.exit('start');
            });
          }
        }
      } else if (entities.hasOwnProperty(TAGS.HEALTH)) { // Medical Services
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
              const counter = resources.length > 3 ? 3 : resources.length;
              let message = 'Here are some places we\'ve found close to your location: \n\n';
              for (let i = counter; i > 0; i -= 1) {
                const resource = resources[i];
                message += `${resource.name} \n ${resource.website} \n ${resource.short_description || resource.long_description || ''} \n\n`;
              }
              this.messagingClient.send(this.snapshot.constituent, message);
            });
          } else {
            getAnswers({}, {
              label: 'health-clinic',
              organization_id: this.get('organization').id,
            }, { withRelated: true }).then((payload) => {
              const answer = payload.toJSON()[0];
              let message;
              if (payload.length === 0) {
                message = 'I\'m sorry. I can\'t find anything in our database. I\'m going to let the city know about your need.';
              } else {
                message = answer.url ? `${answer.answer} (More info at ${answer.url})` : `${answer.answer}`;
              }
              this.messagingClient.send(this.snapshot.constituent, message);
              this.exit('start');
            });
          }
        }
      } else if (entities.hasOwnProperty(TAGS.EMPLOYMENT)) { // Employment Services
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
              const counter = resources.length > 3 ? 3 : resources.length;
              let message = 'Here are some places we\'ve found close to your location: \n\n';
              for (let i = counter; i > 0; i -= 1) {
                const resource = resources[i];
                message += `${resource.name} \n ${resource.website} \n ${resource.short_description || resource.long_description || ''} \n\n`;
              }
              this.messagingClient.send(this.snapshot.constituent, message);
            });
          } else {
            getAnswers({}, {
              label: 'employment-job-training',
              organization_id: this.get('organization').id,
            }, { withRelated: true }).then((payload) => {
              const answer = payload.toJSON()[0];
              let message;
              if (payload.length === 0) {
                message = 'I\'m sorry. I can\'t find anything in our database. I\'m going to let the city know about your need.';
              } else {
                message = answer.url ? `${answer.answer} (More info at ${answer.url})` : `${answer.answer}`;
              }
              this.messagingClient.send(this.snapshot.constituent, message);
              this.exit('start');
            });
          }
        }
      } else {
        this.messagingClient.send(this.snapshot.constituent, 'I\'m not sure I understanding. Can you try phrase that differently?');
        this.exit('start');
      }
    });
  },

  complaintStart() {
    this.messagingClient.send(this.snapshot.constituent, 'You\'re having a problem? Can you describe the whole situation to me? I\'ll do my best to forward it along to the right department.');
    this.exit('complaintText');
  },

  complaintText() {
    const text = this.get('input').payload.text;
    if (text) {
      const complaint = {
        text,
      };
      this.set('complaint', complaint);
      this.messagingClient.send(this.snapshot.constituent, 'Great, if it makes sense to send a picture, can you send it? If not, simply say you don\'t have one');
      this.exit('complaintPicture');
    }
  },

  complaintPicture() {
    const payload = this.get('input').payload;
    if (payload.attachments) {
      this.messagingClient.send(this.snapshot.constituent, 'Thank you!');
      const updatedComplaint = Object.assign({}, this.get('complaint'), {
        attachments: payload.attachments,
      });
      this.set('complaint', updatedComplaint);
    }
    this.messagingClient.send(this.snapshot.constituent, 'Can you send your location? That can simply be an address or a pin on the map.');
    this.exit('complaintLocation');
  },

  complaintLocation() {
    const payload = this.get('input').payload;
    if (payload.location) {
      const updatedComplaint = Object.assign({}, this.get('complaint'), {
        location: {
          latitude: payload.location.coordinates.latitude,
          longitude: payload.location.coordinates.longitude,
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
    // If a city has email, use that, otherwise, slack it to us to follow up with the city on
    if (this.get('organization').email) {
      let message = complaint.text;
      if (complaint.location) {
        message += `( Geo-location: http://maps.google.com/maps?q=${complaint.location.latitude},${complaint.location.longitude}=${complaint.location.latitude},${complaint.location.longitude} )`;
      }
      if (complaint.attachments) {
        message += `( Attachment: ${complaint.attachments[0].payload.url} )`;
      }
      new EmailService().send('Constituent Complaint', message, 'mark@unitedworks.us', 'cases@mayor.chat');
    } else {
      let message = `>*City*: ${this.get('organization').name}\n>*Constituent ID*: ${this.snapshot.constituent_id}\n>*Complaint*: ${complaint.text}`;
      if (complaint.location) {
        message += `\n>*Geo-location*: <http://maps.google.com/maps/place/${complaint.location.latitude},${complaint.location.longitude}|${complaint.location.latitude},${complaint.location.longitude}>`;
      }
      if (complaint.attachments) {
        message += `\n>*Attachment*: <${complaint.attachments[0].payload.url}|Image>`;
      }
      new SlackService().send(message);
    }
    this.messagingClient.send(this.snapshot.constituent, 'I just sent your message along. I\'ll try to let you know when it\'s been addressed.');
    this.exit('start');
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
        case 'MAKE_COMPLAINT':
          self.fire('complaintStart');
          break;
        case 'GET_STARTED':
          self.fire('gettingStarted');
          break;
        case 'CHANGE_CITY':
          self.fire('location', null, { previous: self.current || self.previous });
          break;
        case 'REGISTER_YOUR_CITY':
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
    }

  }
}
