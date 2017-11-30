import moment from 'moment';
import { randomPick } from '../helpers';
import WeatherClient from '../clients/weather-client';
import * as QUICK_REPLIES from '../templates/quick-replies';

export default {
  what_am_i() {
    const message = randomPick([
      '🤖 I\'m a chatbot trying to get you in touch with the right folks in gov!',
    ]);
    this.messagingClient.send(message);
    return this.getBaseState();
  },
  chatbot_curiosity() {
    const message = 'Chatbots are automated assistants 🤖. They\'ve been around for decades, but they\'re very new to government! I\'m one of the only in the world :)';
    this.messagingClient.send(message);
    return this.getBaseState();
  },
  has_question() {
    this.messagingClient.send('What\'s your question?');
    return this.getBaseState();
  },
  makers() {
    const message = randomPick([
      `${this.get('organization').name} working with Hey Mayor! (https://mayor.chat)`,
      'Mark and Nick! 📷 → instagram.com/heymayor',
    ]);
    this.messagingClient.send(message);
    return this.getBaseState();
  },
  age() {
    const age = moment([2017, 9, 30]).fromNow(true);
    this.messagingClient.send(`I've been around for ${age}!`);
    return this.getBaseState();
  },
  handle_greeting() {
    const greetings = [
      'Hello neighbor!',
      '👋 Howdy!',
      'Hey there! What can I help you with?',
    ];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    this.messagingClient.send(greeting, QUICK_REPLIES.basicRequestQuickReplies);
    return this.getBaseState();
  },
  handle_praise() {
    const thanks = [
      'Thank you!',
      'Thanks!',
    ];
    const thank = thanks[Math.floor(Math.random() * thanks.length)];
    this.messagingClient.send(thank);
    return this.getBaseState();
  },
  handle_thank_you() {
    const youreWelcomes = [
      'You are very welcome!',
      'No problem!',
    ];
    const youreWelcome = youreWelcomes[Math.floor(Math.random() * youreWelcomes.length)];
    this.messagingClient.send(youreWelcome);
    return this.getBaseState();
  },
  async weather() {
    const forecast = await new WeatherClient().dayForecast(
      this.get('organization').location.lat, this.get('organization').location.lon).then(f => f);
    const quickReplies = [];
    if (this.get('notifications') && !this.get('notifications').weather) {
      quickReplies.push(QUICK_REPLIES.weatherOn);
    }
    this.messagingClient.send(`${WeatherClient.emojiMap[forecast.weather.id] || ''} Looks like today will have a low of ${forecast.min}° and a high of ${forecast.max}°${forecast.weather.description ? ` with ${forecast.weather.description}.` : ''}`, quickReplies);
    return this.getBaseState();
  },
  math() {
    const message = randomPick([
      "I'm made of 1s and 0s, but that doesn't mean I know how to add them together!",
    ]);
    this.messagingClient.send(message);
    return this.getBaseState();
  },
};
