const yesNoTemplates = [
  [
    { content_type: 'text', title: 'Yes', payload: 'Yes' },
    { content_type: 'text', title: 'No', payload: 'No' },
  ], [
    { content_type: 'text', title: 'You bet', payload: 'You bet' },
    { content_type: 'text', title: 'Nope', payload: 'Nope' },
  ], [
    { content_type: 'text', title: 'Yah', payload: 'Yah' },
    { content_type: 'text', title: 'No', payload: 'No' },
  ],
];

export const yesNo = yesNoTemplates[0];
export const yesNoMix = () => yesNoTemplates[Math.floor(Math.random() * yesNoTemplates.length)];

const sureNoThanksTemplates = [
  [
    { content_type: 'text', title: 'Sure!', payload: 'Sure!' },
    { content_type: 'text', title: 'No thanks', payload: 'No thanks' },
  ], [
    { content_type: 'text', title: 'Sounds good!', payload: 'Sounds good!' },
    { content_type: 'text', title: 'No thank you', payload: 'No thank you' },
  ],
];

export const sureNoThanks = sureNoThanksTemplates[1];
export const sureNoThanksMix = () => sureNoThanksTemplates[Math.floor(Math.random() * sureNoThanksTemplates.length)];

export const location = {
  content_type: 'location',
};

export const exit = { content_type: 'text', title: 'Nevermind', payload: 'Nevermind' };

export const whatCanIAsk = { content_type: 'text', title: 'F.A.Q. List', payload: 'What can I Ask?' };

export const evalHelpfulAnswer = [
  { content_type: 'text', title: '👍', payload: 'ANSWER_HELPFUL' },
  { content_type: 'text', title: '👎', payload: 'ANSWER_NOT_HELPFUL' },
];

export const allNotificationsOn = { content_type: 'text', title: 'Turn On Reminders', payload: 'Turn on notifications' };
export const allNotificationsOff = { content_type: 'text', title: 'Turn Off Reminders', payload: 'Turn off notifications' };

export const sanitationOn = { content_type: 'text', title: 'Turn On ♻', payload: 'Turn on sanitation notifications' };
export const sanitationOff = { content_type: 'text', title: 'Turn Off ♻', payload: 'Turn off sanitation notifications' };
export const sanitationNotification = [
  sanitationOn,
  sanitationOff,
  allNotificationsOn,
];

export const weatherOff = { content_type: 'text', title: 'Turn Off ❄', payload: 'Turn off weather notifications' };
export const weatherOn = { content_type: 'text', title: 'Turn On ❄', payload: 'Turn on weather notifications' };
export const weatherNotification = [
  weatherOn,
  weatherOff,
  allNotificationsOn,
];

export const eventsOff = { content_type: 'text', title: 'Turn Off 📅', payload: 'Turn off event notifications' };
export const eventsOn = { content_type: 'text', title: 'Turn On 📅', payload: 'Turn on event notifications' };
export const eventNotification = [
  eventsOn,
  eventsOff,
  allNotificationsOn,
];

export const alertsOff = { content_type: 'text', title: 'Turn Off 🚨', payload: 'Turn off alert notifications' };
export const alertsOn = { content_type: 'text', title: 'Turn On 🚨', payload: 'Turn on alert notifications' };

export const basicRequestQuickReplies = [
  { content_type: 'text', title: 'What can I ask?', payload: 'What can I ask?' },
  allNotificationsOn,
  { content_type: 'text', title: 'Upcoming Elections', payload: 'Upcoming Elections' },
];
