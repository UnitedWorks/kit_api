import moment from 'moment';
import { getPlacesUrl } from '../../utils';
import { ILLUSTRATION_URLS } from './assets';

export const genericSanitation = {
  title: 'Ask Schedule and Service Info',
  subtitle: 'Get schedule information about garbage, recycling, and more!',
  image_url: ILLUSTRATION_URLS.events,
  buttons: [{
    type: 'postback',
    title: 'Garbage Schedule',
    payload: 'Garbage Schedule',
  }, {
    type: 'postback',
    title: 'Recycling Schedule',
    payload: 'Recycling Schedule',
  }, {
    type: 'element_share',
  }],
};

export const genericVotingAndElections = {
  title: 'Voting and Elections',
  subtitle: 'Ask about elections, voter ID laws, registration deadlines, and anything else to help you elect representatives!',
  image_url: ILLUSTRATION_URLS.voting,
  buttons: [{
    type: 'postback',
    title: 'Upcoming Elections',
    payload: 'Upcoming Elections',
  }, {
    type: 'postback',
    title: 'Register To Vote',
    payload: 'Register To Vote',
  }, {
    type: 'element_share',
  }],
};

export const genericRenter = {
  title: 'Know the Neighborhood',
  subtitle: 'Let us know how we can help your community!',
  image_url: ILLUSTRATION_URLS.renters,
  buttons: [{
    type: 'postback',
    title: 'Request Street light',
    payload: 'Request street light',
  }, {
    type: 'postback',
    title: 'Report Graffiti',
    payload: 'Report graffiti',
  }, {
    type: 'element_share',
  }],
};

// Biker
export const genericCommuter = {
  title: 'Transportation Feedback',
  subtitle: 'Report and request services around your community and in transit.',
  image_url: ILLUSTRATION_URLS.transit,
  buttons: [{
    type: 'postback',
    title: 'Driveway Blocked',
    payload: 'Driveway blocked',
  }, {
    type: 'postback',
    title: 'Request Bikelane',
    payload: 'Request bikelane',
  }, {
    type: 'element_share',
  }],
};

export const genericDirectory = {
  title: 'Directory',
  subtitle: 'Get hours and contact information for departments.',
  image_url: ILLUSTRATION_URLS.asking,
  buttons: [{
    type: 'postback',
    title: 'Is City Hall Open?',
    payload: 'Is City Hall Open?',
  }, {
    type: 'postback',
    title: 'Mayors Contact Info',
    payload: 'Mayors Contact Info',
  }, {
    type: 'element_share',
  }],
};

export const genericEvents = {
  title: 'Events',
  subtitle: 'Find out about upcoming town celebrations, council meetings, and other official events!',
  image_url: ILLUSTRATION_URLS.parents,
  buttons: [{
    type: 'postback',
    title: 'Upcoming Events',
    payload: 'Upcoming Events',
  }, {
    type: 'postback',
    title: 'Next Council Meeting',
    payload: 'Next Council Meeting',
  }, {
    type: 'element_share',
  }],
};

export const genericAdvert = {
  title: 'About The Chatbot',
  subtitle: 'Learn more about this bot and what it does for local communities!',
  image_url: ILLUSTRATION_URLS.neighborhood,
  buttons: [{
    type: 'postback',
    title: 'What\'s a chatbot?',
    payload: 'What\'s a chatbot?',
  }, {
    type: 'postback',
    title: 'Who Made This?',
    payload: 'Who Made This?',
  }, {
    type: 'element_share',
  }],
};

// Big Business Owner Tiles
export const genericBusiness = {
  title: 'Business & Employment',
  subtitle: 'Get your business off the ground or land a new job!',
  image_url: ILLUSTRATION_URLS.business,
  buttons: [{
    type: 'postback',
    title: 'Job Openings',
    payload: 'Job Openings',
  }, {
    type: 'postback',
    title: 'Start a Business',
    payload: 'Start a Business',
  }, {
    type: 'element_share',
  }],
};

export function genericContact(contact) {
  const element = {
    title: contact.name,
    subtitle: `${contact.title ? `${contact.title} - ` : ''}${contact.responsibilities}`,
  };
  const buttons = [];
  if (contact.phone_number) {
    buttons.push({
      type: 'phone_number',
      title: contact.phone_number,
      payload: contact.phone_number,
    });
  }
  if (contact.email) {
    buttons.push({
      type: 'email',
      title: contact.email,
      email: contact.email,
    });
  }
  if (contact.url) {
    buttons.push({
      type: 'web_url',
      title: contact.url,
      url: contact.url,
      webview_height_ratio: 'tall',
    });
  }
  if (buttons.length < 3) buttons.push({ type: 'element_share' });
  if (buttons.length > 0) element.buttons = buttons;
  return element;
}

export function genericFacility(facility) {
  const element = {
    title: `${facility.name} (Facility)`,
    subtitle: `${facility.brief_description}`,
  };
  const buttons = [];
  if (facility.hasOwnProperty('location') && facility.location.display_name != null) {
    buttons.push({
      type: 'web_url',
      title: facility.location.display_name,
      url: getPlacesUrl(facility.location.display_name),
    });
  }
  if (facility.phone_number) {
    buttons.push({
      type: 'phone_number',
      title: facility.phone_number,
      payload: facility.phone_number,
    });
  }
  if (facility.url) {
    buttons.push({
      type: 'web_url',
      title: facility.url,
      url: facility.url,
      webview_height_ratio: 'tall',
    });
  }
  if (facility.email && buttons.length < 3) {
    buttons.push({
      type: 'email',
      title: facility.email,
      email: facility.email,
    });
  }
  if (buttons.length < 3) buttons.push({ type: 'element_share' });
  if (buttons.length > 0) element.buttons = buttons;
  return element;
}

export function genericService(service) {
  const element = {
    title: `${service.name} (Service)`,
    subtitle: `${service.brief_description}`,
  };
  const buttons = [];
  if (service.phone_number) {
    buttons.push({
      type: 'phone_number',
      title: service.phone_number,
      payload: service.phone_number,
    });
  }
  if (service.email) {
    buttons.push({
      type: 'email',
      title: service.email,
      email: service.email,
    });
  }
  if (service.url) {
    buttons.push({
      type: 'web_url',
      title: service.url,
      url: service.url,
      webview_height_ratio: 'tall',
    });
  }
  if (buttons.length < 3) buttons.push({ type: 'element_share' });
  if (buttons.length > 0) element.buttons = buttons;
  return element;
}

export function genericEvent(event) {
  const element = {
    title: `${event.name} (Event)`,
  };
  // Set date-time
  let dtString = null;
  if (event.availabilitys[0].t_start && event.availabilitys[0].t_end) {
    dtString = `${moment(event.availabilitys[0].t_start).format('ddd, MMM Do YYYY, h:mm a')} - ${moment(event.availabilitys[0].t_end).format('h:mm a')}`;
  } else if (event.availabilitys[0].t_start) {
    dtString = moment(event.availabilitys[0].t_start).format('ddd, MMM Do YYYY, h:mm a');
  }
  if (dtString) element.subtitle = dtString;
  if (event.description) element.subtitle = `${element.subtitle} - ${event.description}`;
  const buttons = [];
  if (event.hasOwnProperty('location') && event.location.display_name != null) {
    buttons.push({
      type: 'web_url',
      title: event.location.display_name,
      url: getPlacesUrl(event.location.display_name),
    });
  }
  if (event.url) {
    buttons.push({
      type: 'web_url',
      title: event.url,
      url: event.url,
      webview_height_ratio: 'tall',
    });
  }
  if (buttons.length < 3) buttons.push({ type: 'element_share' });
  if (buttons.length > 0) element.buttons = buttons;
  return element;
}

export function genericWelcome(bannerUrl, orgName) {
  return {
    title: `${orgName ? `Hey ${orgName}!` : 'Welcome!'}`,
    subtitle: 'Have a question? Reporting a problem? Let\'s chat!',
    image_url: bannerUrl || ILLUSTRATION_URLS.transit,
    buttons: [{
      type: 'postback',
      title: 'What\'s a chatbot?',
      payload: 'What\'s a chatbot?',
    }, {
      type: 'postback',
      title: 'Upcoming Events',
      payload: 'Upcoming Events',
    }, {
      type: 'element_share',
    }],
  };
}
