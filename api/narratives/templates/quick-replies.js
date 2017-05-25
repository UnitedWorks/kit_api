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

export const makeRequest = [{
  content_type: 'text', title: 'Make a Request', payload: 'MAKE_REQUEST',
}];
