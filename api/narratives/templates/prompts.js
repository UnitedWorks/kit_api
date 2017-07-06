export const createCasePrompt = {
  label: 'create_case',
  name: 'General Case',
  steps: [{
    instruction: 'Can you describe your problem?',
    type: 'text',
  }, {
    instruction: 'Can you send a picture?',
    type: 'picture',
  }, {
    instruction: 'Can you send your location?',
    type: 'text',
  }],
  actions: [{
    type: 'create_case',
  }],
};
