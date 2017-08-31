module.exports = [
  {
    "text": "What are the hours of city hall?",
    "intent": "search.knowledge_entity",
    "entities": [
      {
        "value": "availability.schedule",
        "entity": "entity_property"
      },
      {
        "start": 22,
        "end": 31,
        "value": "city hall",
        "entity": "wit$local_search_query"
      }
    ]
  },
  {
    "text": "What is the phone number of city hall?",
    "intent": "search.knowledge_entity",
    "entities": [
      {
        "value": "contact.phone",
        "entity": "entity_property"
      },
      {
        "start": 28,
        "end": 37,
        "value": "city hall",
        "entity": "wit$local_search_query"
      }
    ]
  },
  {
    "text": "How do I get in touch with my local precinct?",
    "intent": "search.knowledge_entity",
    "entities": [
      {
        "value": "contact",
        "entity": "entity_property"
      },
      {
        "start": 30,
        "end": 44,
        "value": "local precinct",
        "entity": "wit$local_search_query"
      }
    ]
  },
  {
    "text": "Where is the public library?",
    "intent": "search.knowledge_entity",
    "entities": [
      {
        "value": "location",
        "entity": "entity_property"
      },
      {
        "start": 13,
        "end": 27,
        "value": "public library",
        "entity": "wit$local_search_query"
      }
    ]
  },
  {
    "text": "What are the hours of the resident response center?",
    "intent": "search.knowledge_entity",
    "entities": [
      {
        "value": "availability.schedule",
        "entity": "entity_property"
      },
      {
        "start": 26,
        "end": 50,
        "value": "resident response center",
        "entity": "wit$local_search_query"
      }
    ]
  },
  {
    "text": "When is health & human services open?",
    "intent": "search.knowledge_entity",
    "entities": [
      {
        "value": "availability.schedule",
        "entity": "entity_property"
      },
      {
        "start": 8,
        "end": 31,
        "value": "health & human services",
        "entity": "wit$local_search_query"
      }
    ]
  },
  {
    "text": "How can I get in touch with Resident Response Center",
    "intent": "search.knowledge_entity",
    "entities": [
      {
        "value": "contact",
        "entity": "entity_property"
      },
      {
        "start": 28,
        "end": 52,
        "value": "Resident Response Center",
        "entity": "wit$local_search_query"
      }
    ]
  },
  {
    "text": "What is the phone number for the sherif's office?",
    "intent": "search.knowledge_entity",
    "entities": [
      {
        "value": "contact.phone",
        "entity": "entity_property"
      },
      {
        "start": 33,
        "end": 48,
        "value": "sherif's office",
        "entity": "wit$local_search_query"
      }
    ]
  },
  {
    "text": "What is the phone number for the call center?",
    "intent": "search.knowledge_entity",
    "entities": [
      {
        "value": "contact.phone",
        "entity": "entity_property"
      },
      {
        "start": 33,
        "end": 48,
        "value": "sherif's office",
        "entity": "wit$local_search_query"
      }
    ]
  }
];
