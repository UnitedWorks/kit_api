export const i18n = (key, inserts = {}) => {
  const translations = {
    intro_hello: `Hey${inserts.firstName ? ` ${inserts.firstName}` : ''}!`,
    intro_information: 'Hey! Can I help you find something? I can give you department phone numbers, service schedules, event notices, reminders, and more! Just ask!',
    bot_apology: `Sorry, I wasn't expeting that answer or may have misunderstood. ${inserts.appendQuestion ? inserts.appendQuestion : ''}`,
    dont_know: `Sorry, I don’t have an answer to this.${inserts.tryContacting ? ` Try personing ${inserts.tryContacting} if you need assistance now.` : ''}`,
    setup_ask_city: 'Ok! What\'s your CITY and STATE?  Ex) "New Brunswick, NJ"',
    setup_invalid_location: 'I wasn\'t able to find a location. Can you try giving me a CITY and STATE again? Ex) "New Brunswick, NJ"',
    us_vote_attribution: 'Voting/election info provided by the U.S. Vote Foundation',
    get_home_location: inserts.name ? `${inserts.name} depends on your home address. Where do you currently live?` : 'For relevant alerts and service updates, I just need a home address. What is your current address?',
    get_current_location: 'Where are you currently located?',
    see_click_fix: 'Can you report this issue in See Click Fix? We will start working on it as soon as you submit!',
  };
  return translations[key];
};
