export default {
  what_am_i() {
    return this.messagingClient.send('I\'m a bot! I answer your questions as fast as you send them and behind the scenes am working to make government work better for you. You don\'t need to worry about that though :P')
      .then(() => 'smallTalk.start');
  },
  chatbot_curiosity() {
    return this.messagingClient.send('I know... it\'s tough to belive. Natural language processing and bleeding edge communication technology in local government. Whoda thunk. Gotta give props to your local government for giving this a shot.')
      .then(() => 'smallTalk.start');
  },
  have_question() {
    return this.messagingClient.send('I\'m sure! What\'s your question?')
      .then(() => 'smallTalk.start');
  },
};
