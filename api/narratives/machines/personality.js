import { randomPick } from '../helpers';

const basicRequestQuickReplies = [
  { content_type: 'text', title: 'What can I ask?', payload: 'What can I ask?' },
  { content_type: 'text', title: 'Upcoming Elections', payload: 'Upcoming Elections' },
  { content_type: 'text', title: 'Available Benefits', payload: 'Available Benefits' },
  { content_type: 'text', title: 'Raise an Issue', payload: 'MAKE_REQUEST' },
];

export default {
  what_am_i() {
    const message = randomPick([
      '🤖 I\'m a chatbot!',
      '🤖 I\'m a chatbot trying to get you in touch with the right folks in gov!',
    ]);
    return this.messagingClient.send(message).then(() => 'smallTalk.start');
  },
  chatbot_curiosity() {
    const message = 'Chatbots are automated assistants 🤖. They\'ve been around for decades, but they\'re very new to government! I\'m one of the only in the world :)';
    return this.messagingClient.send(message).then(() => 'smallTalk.start');
  },
  has_question() {
    return this.messagingClient.send('What\'s your question?').then(() => 'smallTalk.start');
  },
  makers() {
    const message = randomPick([
      `${this.get('organization').name} working with Hey Mayor! (https://mayor.chat)`,
      'Mark and Nick! 📷 → instagram.com/heymayor',
    ]);
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
