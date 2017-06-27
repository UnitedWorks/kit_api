import { randomPick } from '../helpers';
import { basicRequestQuickReplies } from '../templates/quick-replies';

export default {
  what_am_i() {
    const message = randomPick([
      '🤖 I\'m a chatbot!',
      '🤖 I\'m a chatbot trying to get you in touch with the right folks in gov!',
    ]);
    return this.messagingClient.send(message).then(() => this.getBaseState());
  },
  chatbot_curiosity() {
    const message = 'Chatbots are automated assistants 🤖. They\'ve been around for decades, but they\'re very new to government! I\'m one of the only in the world :)';
    return this.messagingClient.send(message).then(() => this.getBaseState());
  },
  has_question() {
    return this.messagingClient.send('What\'s your question?').then(() => this.getBaseState());
  },
  makers() {
    const message = randomPick([
      `${this.get('organization').name} working with Hey Mayor! (https://mayor.chat)`,
      'Mark and Nick! 📷 → instagram.com/heymayor',
    ]);
    return this.messagingClient.send(message).then(() => this.getBaseState());
  },
  handle_greeting() {
    const greetings = [
      'Hello neighbor!',
      '👋 Howdy!',
      'Hey there! :) What can I help you with?',
    ];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    this.messagingClient.send(greeting, basicRequestQuickReplies);
    return this.getBaseState();
  },
  handle_praise() {
    const thanks = [
      'Thank you!',
      'Thanks!!! :D',
      '<3',
    ];
    const thank = thanks[Math.floor(Math.random() * thanks.length)];
    this.messagingClient.send(thank);
    return this.getBaseState();
  },
  handle_thank_you() {
    const youreWelcomes = [
      'Anytime!',
      'You are very welcome!',
      'No problem!',
      'Np :)',
    ];
    const youreWelcome = youreWelcomes[Math.floor(Math.random() * youreWelcomes.length)];
    this.messagingClient.send(youreWelcome);
    return this.getBaseState();
  },
};
