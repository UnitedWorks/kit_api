const basicRequestQuickReplies = [
  { content_type: 'text', title: 'What can I ask?', payload: 'What can I ask?' },
  { content_type: 'text', title: 'Upcoming Elections', payload: 'Upcoming Elections' },
  { content_type: 'text', title: 'Available Benefits', payload: 'Available Benefits' },
  { content_type: 'text', title: 'Raise an Issue', payload: 'MAKE_REQUEST' },
];

export default {
  what_am_i() {
    const messages = [
      'I\'m a chatbot!',
      'I\'m not a gov employee (so cut me some slack :P)',
    ];
    const message = messages[Math.floor(Math.random() * messages.length)];
    return this.messagingClient.send(message).then(() => 'smallTalk.start');
  },
  chatbot_curiosity() {
    const messages = [
      'Chatbots are automated assistants. They have been around for a long time in theory, but were perfected by role-playing game makers. Chatbots are very new to government though! I\'m one of the only in the world.',
    ];
    const message = messages[Math.floor(Math.random() * messages.length)];
    return this.messagingClient.send(message).then(() => 'smallTalk.start');
  },
  has_question() {
    return this.messagingClient.send('What\'s your question?').then(() => 'smallTalk.start');
  },
  makers() {
    const messages = [
      'Mark and Nick! 📷 → instagram.com/heymayor',
      // `${this.get('organization').name}`,
    ];
    const message = messages[Math.floor(Math.random() * messages.length)];
    return this.messagingClient.send(message).then(() => 'smallTalk.start');
  },
  handle_greeting() {
    const greetings = [
      'Heyyy',
      '👋 Howdy!',
      'Hey there! :) What can I help you with?',
    ];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    this.messagingClient.send(greeting, basicRequestQuickReplies);
    return 'smallTalk.start';
  },
  handle_praise() {
    const thanks = [
      'Thank you!',
      'Thanks!!! :D',
      '<3',
    ];
    const thank = thanks[Math.floor(Math.random() * thanks.length)];
    this.messagingClient.send(thank);
    return 'smallTalk.start';
  },
  handle_thank_you() {
    const youreWelcomes = [
      'Anytime!',
      'You are very welcome',
      'No problem!',
      'Np :)',
    ];
    const youreWelcome = youreWelcomes[Math.floor(Math.random() * youreWelcomes.length)];
    this.messagingClient.send(youreWelcome);
    return 'smallTalk.start';
  },
};
