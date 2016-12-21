#Kit API

API for conversations, cases, cities, and integrations with external services.

----
###Brainstorming/Flow###
These are some scattered thoughts about how the flow of data, from when a message is received until a response is given.
There's bound to be parts that get injected, but I want to get the structure right so the system is a bit more modular for other services.

For example, some scenarios to think about:
- How can a human take over? Before hitting the service, should we find the related conversation in the DB and see if a "Needs Involvement" flag is true
- How might we send back an "is typing" or "received" event

I'm concerned my "actions" word is too vague. But maybe that's the right way to think about it. Ex: knowledgeBase, 311, reportPoliceMisconduct, getBenefits, reportWorkingConditions.How about "engagements", "interactions", "engagement_modules", "alliances"

```
our endpoint is hit =>

  receivedConversationMessage()
    normalizeConversationMessage({ sourceFrom: facebook })
      facebook =>
        facebookMessageToKitMessage()
    sendToService({ followup: sendMessage })
      =>

  sendToService({ type: NLP, message: message, followup: sendMessage })
    => NLP
      handleNLP({ service: ApiAi, message: message, followUp: sendMessage })
        ApiAI =>
          handleApiAiSend({ message: message })
          handleApiAiResponse({ data: data })
            => return data w/ engagement
              handleEngagement(engagement: searchKnowledgeBase, followup: sendMessage )
                =>

  handleEngagement({ engagement: searchKnowledgeBase, data: data, followup: sendMessage })
    => searchKnowledgeBase
      lookupKnowledgeBase({ data: data, followup: sendMessage }) =>
        ... run intent/action label against a slew of switch cases to get instructions on what to do
          If static response:
            => sendMessage()
          If not static response:
            If city knowledge is missing:
              => addContextToKnowledgeBitMessage(fallbackData)
            If geographic info is missing:
              sendConversationMessage({ type: getLocation, convoData })
              => addContextToKnowledgeBitMessage(returnedExtendedData)
            Otherwise:
              addContextToKnowledgeBitMessage(extendedData)
            => sendMessage()
              translateKnowledgeForMessage()
              sendMessage(translatedKnowledgeData, conversationData)

  sendMessage(translatedKnowledgeData, conversationData)
    normalizeConversationMessage({ sourceTo: conversationData.sourceTo })
      conversationData.sourceTo == facebook =>
        kitMessageToFacebookMessage()
          =>
    sendConversationMessage({ sourceTo: conversationData.sourceTo })
      conversationData.sourceTo == facebook =>

        Hits their endpoint
```
