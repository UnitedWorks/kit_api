export const genericSanitation = {
  title: 'The basics!',
  subtitle: 'Schedule information and reminders about garbage and recycling!',
  image_url: 'https://scontent-lga3-1.xx.fbcdn.net/v/t31.0-8/18121443_233251170489974_389513167860373774_o.png?oh=5fdb797d78ed294fab4caeeca524e8dc&oe=598B0541',
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

export const genericDocumentation = {
  title: 'Local Gov Services',
  subtitle: 'Common questions about constituent and business needs',
  image_url: 'https://scontent-lga3-1.xx.fbcdn.net/v/t31.0-8/16463485_187743068374118_731666577286732253_o.png?oh=34db605884afb6fa415694f76f7b8214&oe=59816331',
  buttons: [{
    type: 'postback',
    title: 'Get Pet License',
    payload: 'Get Pet License',
  }, {
    type: 'postback',
    title: 'Get Copy of Deed',
    payload: 'Get Copy of Deed',
  }, {
    type: 'element_share',
  }],
};

export const genericVotingAndElections = {
  title: 'Voting and Elections',
  subtitle: 'Ask about elections, voter ID laws, registration deadlines, and anything else to help you elect representatives!',
  image_url: 'https://scontent-lga3-1.xx.fbcdn.net/v/t31.0-8/16586922_193481711133587_230696876501689696_o.png?oh=00e2b4adcd61378777e5ce3801a44650&oe=59985D7E',
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

export const genericBenefits = {
  title: 'Service Providers and Benefits',
  subtitle: 'Find out what state and federal benefits programs may be available for you and your family.',
  image_url: 'https://scontent-lga3-1.xx.fbcdn.net/v/t31.0-8/18056257_232842120530879_6922898701508692950_o.png?oh=1c387a889c56b387e8ca55b5c4b756af&oe=5994A489',
  buttons: [{
    type: 'postback',
    title: 'Report Wage Theft',
    payload: 'Report Wage Theft',
  }, {
    type: 'postback',
    title: 'Benefits Screener',
    payload: 'Benefits Screener',
  }, {
    type: 'element_share',
  }],
};

export const genericAssistance = {
  title: 'Immediate Help',
  subtitle: 'Find immediate or short-term assistance if you are facing tough times.',
  image_url: 'https://scontent-lga3-1.xx.fbcdn.net/v/t31.0-8/18076480_232825243865900_3433821028911633831_o.png?oh=fcc2d52c34dfb837272ccda9b928de22&oe=59766CF9',
  buttons: [{
    type: 'postback',
    title: 'Find Shelter',
    payload: 'Find Shelter',
  }, {
    type: 'postback',
    title: 'Find Clinic',
    payload: 'Find Clinic',
  }, {
    type: 'element_share',
  }],
};

export const genericRenter = {
  title: 'Tips for Renters',
  subtitle: 'Find immediate or short-term assistance if you are facing tough times.',
  image_url: 'https://scontent-lga3-1.xx.fbcdn.net/v/t31.0-8/18595483_245617925919965_1771925793445361205_o.png?oh=c41f5dc53c6f8aae50ff6d932f2d3c2f&oe=59743919',
  buttons: [{
    type: 'postback',
    title: 'Check stabilized rent',
    payload: 'Check Stabilized Rent',
  }, {
    type: 'postback',
    title: 'Find affordable housing',
    payload: 'Find Affordable Housing',
  }, {
    type: 'element_share',
  }],
};

// Big New Residents List
export const genericNewResident = {
  title: 'Know Your Community!',
  subtitle: 'Learn what is going on around you and how to interact with local gov!',
  image_url: 'https://scontent.xx.fbcdn.net/v/t31.0-8/18589000_245329029282188_201697997574538644_o.png?oh=3c0896d62bc013dc7a520cd8aef2ec7d&oe=59B0D211',
  buttons: [{
    type: 'postback',
    title: 'Common Questions',
    payload: 'FREQ_QUESTION_LIST',
  }, {
    type: 'postback',
    title: 'Common Services',
    payload: 'FREQ_SERVICE_LIST',
  }, {
    type: 'element_share',
  }],
};

// Biker
export const genericCommuter = {
  title: 'Commuter & Biker Feedback',
  subtitle: 'Push for better biking biking conditions and commute alerts',
  image_url: 'https://scontent.fewr1-3.fna.fbcdn.net/v/t31.0-8/18814995_251679365313821_3512955472682371977_o.png?oh=972a17ce194fe9a53a82058aa2da2f72&oe=59A622A2',
  buttons: [{
    type: 'postback',
    title: 'Request A Bike Lane',
    payload: 'Request A Bike Lane',
  }, {
    type: 'postback',
    title: 'Report a Pothole',
    payload: 'Report a Pothole',
  }, {
    type: 'element_share',
  }],
};

// Maybe getting to know the town can be more than an answer. Could be events, tourism, local town meetings, etc.
// export const genericNewResidentGetAquaintedList = [];

export const genericNewResidentFAQList = [{
  title: 'Trash + Recycling',
  buttons: [{
    type: 'postback',
    title: 'Trash Schedule',
    payload: 'Trash Schedule',
  }, {
    type: 'postback',
    title: 'Recycling Schedule',
    payload: 'Recycling Schedule',
  }, {
    type: 'postback',
    title: 'Bulk Pickup Request',
    payload: 'Bulk Pickup Request',
  }],
}, {
  title: 'Getting Documents',
  buttons: [{
    type: 'postback',
    title: 'Request a Service',
    payload: 'Request A Service',
  }, {
    type: 'postback',
    title: 'Make a Complaint',
    payload: 'MAKE_REQUEST',
  }, {
    type: 'postback',
    title: 'See My Requests',
    payload: 'GET_REQUESTS',
  }],
}, {
  title: 'Immediate Assistance',
  buttons: [{
    type: 'postback',
    title: 'Find Nearby Shelter',
    payload: 'Find Nearby Shelter',
  }, {
    type: 'postback',
    title: 'Find Nearby Clinic',
    payload: 'Find Nearby Clinic',
  }, {
    type: 'postback',
    title: 'Find Nearby Washroom',
    payload: 'Find Nearby Washroom',
  }],
}];

export const genericNewResidentServicesList = [{
  title: 'Local Business',
  buttons: [{
    type: 'postback',
    title: 'Request a Service',
    payload: 'Request A Service',
  }, {
    type: 'postback',
    title: 'Make a Complaint',
    payload: 'MAKE_REQUEST',
  }],
}];

// Big Business Owner Tiles
export const genericBusiness = {
  title: 'Local Business',
  subtitle: 'Get the right permits and government contract opportunities.',
  image_url: 'https://scontent.xx.fbcdn.net/v/t31.0-8/18556650_245320545949703_5356655391224303171_o.png?oh=673830163e7d76ae394741b1b4abf040&oe=59B2618D',
  buttons: [{
    type: 'postback',
    title: 'Government Contracts',
    payload: 'Government Contracts',
  }, {
    type: 'postback',
    title: 'Permits, Licenses, ...',
    payload: 'FREQ_BUSINESS_REQUIREMENTS_LIST',
  }, {
    type: 'element_share',
  }],
};

export const genericBusinessQuestions = [{
  title: 'Planning and Zoning',
  buttons: [{
    type: 'postback',
    title: 'Development Services',
    payload: 'Development Services',
  }, {
    type: 'postback',
    title: 'Expedited Processing',
    payload: 'Expedited Processing',
  }, {
    type: 'postback',
    title: 'Historic Preservation',
    payload: 'Historic Preservation',
  }],
}, {
  title: 'Local Government Contracts',
  buttons: [{
    type: 'postback',
    title: 'Where are contracts?',
    payload: 'Where Are Contracts?',
  }, {
    type: 'postback',
    title: 'Become a Vendor',
    payload: 'Become A Vendor',
  }, {
    type: 'postback',
    title: 'Get Notifications',
    payload: 'Get Notifications',
  }],
}];

export const genericBusinessRequirements = [{
  title: 'Permits',
  buttons: [{
    type: 'postback',
    title: 'What needs a permit?',
    payload: 'What Needs A Permit?',
  }, {
    type: 'postback',
    title: 'Filming Permits',
    payload: 'Filming Permits',
  }, {
    type: 'postback',
    title: 'Food Service Permits',
    payload: 'Food Service Permits',
  }],
}, {
  title: 'Inspections',
  buttons: [{
    type: 'postback',
    title: 'Schedule Fire Inspection',
    payload: 'Schedule Fire Inspection',
  }, {
    type: 'postback',
    title: 'Schedule Safety Inspection',
    payload: 'Schedule Safety Inspection',
  }, {
    type: 'postback',
    title: 'Schedule Health Inspection',
    payload: 'Schedule Health Inspection',
  }],
}];

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
  if (contact.website) {
    buttons.push({
      type: 'web_url',
      title: contact.website,
      url: contact.website,
    });
  }
  if (buttons.length < 3) buttons.push({ type: 'element_share' });
  if (buttons.length > 0) element.buttons = buttons;
  return element;
}

export function genericWelcome(bannerUrl, orgName) {
  return {
    title: `${orgName ? `Your ${orgName} Assistant` : 'Welcome!'}`,
    subtitle: 'Have a question? Reporting a problem? Let\'s chat!',
    image_url: bannerUrl,
    buttons: [{
      type: 'postback',
      title: 'What\'s a chatbot?',
      payload: 'What\'s a chatbot?',
    }, {
      type: 'postback',
      title: 'What can I ask?',
      payload: 'What Can I Ask?',
    }, {
      type: 'element_share',
    }],
  };
}
