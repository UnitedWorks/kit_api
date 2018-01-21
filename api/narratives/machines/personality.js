import moment from 'moment';
import { randomPick } from '../helpers';
import WeatherClient from '../clients/weather-client';
import * as QUICK_REPLIES from '../templates/quick-replies';

export default {
  what_am_i() {
    const message = randomPick([
      `I am your digital assistant to help you find the information you need about ${this.snapshot.organization.name}. Ask me anything and I will try to find the answer for you!`,
    ]);
    this.messagingClient.send(message);
    return this.getBaseState();
  },
  chatbot_curiosity() {
    const message = 'Chatbots are automated digital assistants. They\'ve been around for decades as experiments, but now they are starting to become more common!';
    this.messagingClient.send(message);
    return this.getBaseState();
  },
  has_question() {
    this.messagingClient.send('What\'s your question?');
    return this.getBaseState();
  },
  makers() {
    const message = randomPick([
      `${this.snapshot.organization.name} working with Hey Mayor! (https://mayor.chat)`,
      // 'Mark and Nick! 📷 → instagram.com/heymayor',
    ]);
    this.messagingClient.send(message);
    return this.getBaseState();
  },
  age() {
    const age = moment([2017, 9, 30]).fromNow(true);
    this.messagingClient.send(`I've been around for ${age}!`);
    return this.getBaseState();
  },
  name() {
    this.messagingClient.send("Chatbots don't usually have names, but some folks call me Jane!");
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
      'You are very welcome! Let me know if you need anything else.',
      'Happy to help! Let me know if you need anything else.',
    ];
    const youreWelcome = youreWelcomes[Math.floor(Math.random() * youreWelcomes.length)];
    this.messagingClient.send(youreWelcome);
    return this.getBaseState();
  },
  handle_frustration() {
    this.messagingClient.send("Sorry, I can't do a better job :( There are people improving my abilities every day. I hope I can do a better job for you tomorrow.");
    return this.getBaseState();
  },
  time() {
    this.messagingClient.send(`The current time is ${moment().format('h:mm a')}`);
    return this.getBaseState();
  },
  async weather() {
    const forecast = await new WeatherClient().dayForecast(
      this.snapshot.organization.address.location.coordinates[0], this.snapshot.organization.address.location.coordinates[1]).then(f => f);
    const quickReplies = [];
    if (this.get('notifications') && !this.get('notifications').weather) {
      quickReplies.push(QUICK_REPLIES.weatherOn);
    }
    this.messagingClient.send(`${WeatherClient.emojiMap[forecast.weather.id] || ''} Looks like today will have a low of ${forecast.min}° and a high of ${forecast.max}°${forecast.weather.description ? ` with ${forecast.weather.description}.` : ''}`, quickReplies);
    return this.getBaseState();
  },
  jokes() {
    const message = randomPick([
      // "I don't know any, but I know some that run for office!",
      "I'm working on being a helpful public servant before I start my stand up career :P",
    ]);
    this.messagingClient.send(message);
    return this.getBaseState();
  },
};
