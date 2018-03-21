import moment from 'moment';
import { addressToString, getCoordinatesFromAddress, getMapsViewUrl, getStaticMapsImageUrl } from '../../geo/helpers';
import { ILLUSTRATION_URLS } from './assets';

export const genericSanitation = {
  title: 'Service Schedules & Info',
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
  subtitle: 'Ask about elections, voting deadlines, and other political information!',
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

export const genericHousing = {
  title: 'Housing',
  subtitle: 'Report issues and find information about developments and tenant rights.',
  image_url: ILLUSTRATION_URLS.renters,
  buttons: [{
    type: 'postback',
    title: 'Affordable Housing',
    payload: 'Affordable housing info',
  }, {
    type: 'postback',
    title: 'Housing Rights Guide',
    payload: 'Housing rights guide',
  }, {
    type: 'element_share',
  }],
};

// Biker
export const genericCommuter = {
  title: 'Commuting & Transportation',
  subtitle: 'Report issues and request services around transit.',
  image_url: ILLUSTRATION_URLS.transit,
  buttons: [{
    type: 'postback',
    title: "My Driveway's Blocked",
    payload: 'Someone is blocking my driveway',
  }, {
    type: 'postback',
    title: 'Join Bike Sharing',
    payload: 'Join bike sharing',
  }, {
    type: 'element_share',
  }],
};

export const genericDirectory = {
  title: 'Directory',
  subtitle: 'Get information about departments and organizations.',
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
  subtitle: 'Learn about upcoming celebrations, council meetings, and other official events!',
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

export const SeeClickFixElement = {
  title: 'SeeClickFix',
  subtitle: "Report issues and concerns. Get updates on what you've reported.",
  buttons: [{
    type: 'web_url',
    title: 'Report Online',
    url: 'https://seeclickfix.com/report',
    webview_height_ratio: 'tall',
  }, {
    type: 'element_share',
  }],
};

export const SeeClickFixTemplate = {
  type: 'template',
  templateType: 'generic',
  elements: [SeeClickFixElement],
};

export function genericOrganization(organization) {
  const element = {
    title: organization.name,
    subtitle: `${organization.description ? organization.description : ''}`,
  };
  const buttons = [];
  if (organization.url) {
    buttons.push({
      type: 'web_url',
      title: organization.url,
      url: organization.url,
      webview_height_ratio: 'tall',
    });
  }
  if (organization.phones && organization.phones.length > 0) {
    const firstPhone = organization.phones[0];
    buttons.push({
      type: 'phone_number',
      title: `${firstPhone.number}${firstPhone.extension ? ` x${firstPhone.extension}` : ''}`,
      payload: `${firstPhone.number}${firstPhone.extension ? `,${firstPhone.extension}` : ''}`,
    });
  }
  if (organization.address
    || (organization.addresses && organization.addresses.length > 0)
    || (organization.places && organization.places.length > 0)) {
    // If we have coordinates, organization!
    let addressObj = organization.address || organization.addresses[0];
    if (!addressObj && organization.places && organization.places.length === 1
      && organization.places[0].addresses && organization.places[0].addresses.length > 0) {
      addressObj = organization.places[0].addresses[0];
    }
    const coords = getCoordinatesFromAddress(addressObj);
    if (coords) {
      buttons.push({
        type: 'web_url',
        title: 'View on Map',
        url: getMapsViewUrl({ coordinates: coords, string: organization.name }),
      });
      // Set Static Image
      element.image_url = getStaticMapsImageUrl(coords[0], coords[1]);
      element.default_action = {
        type: 'web_url',
        url: getMapsViewUrl({ coordinates: coords, string: organization.name }),
      };
    }
  }
  if (buttons.length < 3) buttons.push({ type: 'element_share' });
  if (buttons.length > 0) element.buttons = buttons;
  return element;
}

export function genericPerson(person) {
  const element = {
    title: person.name,
    subtitle: `${person.title ? `${person.title}` : ''}${person.organizations && person.organizations.length > 0 ? ` - ${person.organizations[0].name}` : ''}${person.responsibilities ? ` - ${person.responsibilities}` : ''}`,
  };
  const buttons = [];
  if (person.phones && person.phones.length > 0) {
    const firstPhone = person.phones[0];
    buttons.push({
      type: 'phone_number',
      title: `${firstPhone.number}${firstPhone.extension ? ` x${firstPhone.extension}` : ''}`,
      payload: `${firstPhone.number}${firstPhone.extension ? `,${firstPhone.extension}` : ''}`,
    });
  }
  if (person.url) {
    buttons.push({
      type: 'web_url',
      title: person.url,
      url: person.url,
      webview_height_ratio: 'tall',
    });
  }
  if (person.email) {
    buttons.push({
      type: 'email',
      title: person.email,
      email: person.email,
    });
  }
  if (buttons.length < 3) buttons.push({ type: 'element_share' });
  if (buttons.length > 0) element.buttons = buttons;
  return element;
}

export function genericPhone(phone) {
  const element = {
    title: phone.name,
    subtitle: `${phone.description ? `${phone.description}` : ''}`,
  };
  const buttons = [];
  buttons.push({
    type: 'phone_number',
    title: `${phone.number}${phone.extension ? ` x${phone.extension}` : ''}`,
    payload: `${phone.number}${phone.extension ? `,${phone.extension}` : ''}`,
  });
  if (buttons.length < 3) buttons.push({ type: 'element_share' });
  if (buttons.length > 0) element.buttons = buttons;
  return element;
}

export function genericResource(resource) {
  const element = {
    title: resource.name,
    subtitle: `${resource.description ? `${resource.description}` : ''}`,
  };
  const buttons = [];
  if (resource.url) {
    buttons.push({
      type: 'web_url',
      title: resource.url,
      url: resource.url,
      webview_height_ratio: 'tall',
    });
  }
  if (resource.media && resource.media.length > 0) {
    resource.media.forEach((m, i, a) => {
      if (buttons.length < 3) {
        buttons.push({
          type: 'web_url',
          title: `Download ${m.name && a.length > 1 ? `${m.name.substr(0, 7)}...` : 'File'}`,
          url: m.url,
          webview_height_ratio: 'tall',
        });
      }
    });
  }
  if (buttons.length < 3) buttons.push({ type: 'element_share' });
  element.buttons = buttons;
  return element;
}

export function genericPlace(place) {
  const element = {
    title: place.name,
    subtitle: `${place.description ? `${place.description}` : ''}`,
  };
  const buttons = [];
  if (place.location || place.address || (place.addresses && place.addresses.length > 0)) {
    // If we have coordinates, place!
    const coords = place.location
      ? place.location.coordinates
      : getCoordinatesFromAddress(place.address || place.addresses[0]);
    if (coords) {
      // Add Button
      buttons.push({
        type: 'web_url',
        title: 'View on Map',
        url: getMapsViewUrl({ coordinates: coords, string: place.name }),
      });
      // Set Static Image
      element.image_url = getStaticMapsImageUrl(coords[0], coords[1]);
      element.default_action = {
        type: 'web_url',
        url: getMapsViewUrl({ coordinates: coords, string: place.name }),
      };
    }
  }
  if (place.phones && place.phones.length > 0) {
    const firstPhone = place.phones[0];
    buttons.push({
      type: 'phone_number',
      title: `${firstPhone.number}${firstPhone.extension ? ` x${firstPhone.extension}` : ''}`,
      payload: `${firstPhone.number}${firstPhone.extension ? `,${firstPhone.extension}` : ''}`,
    });
  }
  if (place.url) {
    buttons.push({
      type: 'web_url',
      title: place.url,
      url: place.url,
      webview_height_ratio: 'tall',
    });
  }
  if (place.email && buttons.length < 3) {
    buttons.push({
      type: 'email',
      title: place.email,
      email: place.email,
    });
  }
  if (buttons.length < 3) buttons.push({ type: 'element_share' });
  if (buttons.length > 0) element.buttons = buttons;
  return element;
}

export function genericService(service) {
  const element = {
    title: service.name,
    subtitle: `${service.description ? `${service.description}` : ''}`,
  };
  const buttons = [];
  if (service.phones && service.phones.length > 0) {
    const firstPhone = service.phones[0];
    buttons.push({
      type: 'phone_number',
      title: `${firstPhone.number}${firstPhone.extension ? ` x${firstPhone.extension}` : ''}`,
      payload: `${firstPhone.number}${firstPhone.extension ? `,${firstPhone.extension}` : ''}`,
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
    title: event.name,
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
  if (event.location || event.address) {
    const coords = event.location ? event.location.coordinates : getCoordinatesFromAddress(event.address);
    if (coords) {
      buttons.push({
        type: 'web_url',
        title: 'View on Map',
        url: getMapsViewUrl({ coordinates: coords }),
      });
    }
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
