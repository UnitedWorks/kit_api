export const i18n = (key, inserts = {}) => {
  const translations = {
    intro_hello: `Hey${inserts.firstName ? ` ${inserts.firstName}` : ''}!`,
    intro_information: `Can I help you find something? Ask me any questions about ${inserts.organizationName ? `${inserts.organizationName} ` : 'local '}government!`,
    bot_apology: `Sorry, I wasn't expeting that answer or may have misunderstood. ${inserts.appendQuestion ? inserts.appendQuestion : ''}`,
    dont_know: 'So sorry, I don’t know the answer to this question.  I am going to make a note of this for next time.',
    setup_ask_city: 'Ok! What\'s your CITY and STATE?  Ex) "New Brunswick, NJ"',
    setup_invalid_location: 'Hmm, I wasn\'t able to find anything. Can you try giving me a CITY and STATE again? Ex) "New Brunswick, NJ"',
  };
  return translations[key];
};
