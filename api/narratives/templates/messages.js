export const i18n = (key, inserts = {}) => {
  const translations = {
    intro_hello: `Hey${inserts.firstName ? ` ${inserts.firstName}` : ''}!`,
    intro_information: `Can I help you find something? I can answer questions about ${inserts.organizationName ? `${inserts.organizationName} ` : 'local '}government! I can also reminder you about trash/recycling pickup, events, and the weather!`,
    bot_apology: `Sorry, I wasn't expeting that answer or may have misunderstood. ${inserts.appendQuestion ? inserts.appendQuestion : ''}`,
    dont_know: 'Sorry, I don’t have a programmed response for this. I will let the government know.',
    setup_ask_city: 'Ok! What\'s your CITY and STATE?  Ex) "New Brunswick, NJ"',
    setup_invalid_location: 'Hmm, I wasn\'t able to find anything. Can you try giving me a CITY and STATE again? Ex) "New Brunswick, NJ"',
    us_vote_attribution: 'Voting/election info provided by the U.S. Vote Foundation',
    get_default_location: inserts.name ? `${inserts.name} depends on your home address. Where do you currently live?` : 'For relevant alerts and service updates, I just need a home address. What is your current address?',
    see_click_fix: 'Can you report this issue in See Click Fix? We will start working on it as soon as you submit!',
  };
  return translations[key];
};
