export const i18n = (key, inserts = {}) => {
  const translations = {
    intro_hello: `Hey${inserts.firstName ? ` ${inserts.firstName}` : ''}!`,
    intro_information: `Can I help you find something? I can answer questions about ${inserts.organizationName ? `${inserts.organizationName} ` : 'local '}government! I can also reminder you about trash/recycling pickup, events, and the weather!`,
    bot_apology: `Sorry, I wasn't expeting that answer or may have misunderstood. ${inserts.appendQuestion ? inserts.appendQuestion : ''}`,
    dont_know: 'So sorry, I don’t know the answer to this question.  I am going to make a note of this for next time.',
    setup_ask_city: 'Ok! What\'s your CITY and STATE?  Ex) "New Brunswick, NJ"',
    setup_invalid_location: 'Hmm, I wasn\'t able to find anything. Can you try giving me a CITY and STATE again? Ex) "New Brunswick, NJ"',
    us_vote_attribution: 'Voting/election info provided by the U.S. Vote Foundation',
    get_default_location: inserts.name ? `To lookup availability for ${inserts.name}, we need a default address to check against. Please type "My address is ____" or "Set default address" to do that and ask once more. Thanks!` : 'For notifications and detailed service updates, it helps if we have a home address. Simply type your address to set it as a default.',
  };
  return translations[key];
};
