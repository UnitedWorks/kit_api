module.exports = [
  {
    "text": "Change my city",
    "intent": "settings.locality.change",
    "entities": []
  },
  {
    "text": "I want answers for a different city",
    "intent": "settings.locality.change",
    "entities": []
  },
  {
    "text": "I live at 11 Juniper Drive, Cedar Knolls NJ",
    "intent": "settings.default_location",
    "entities": [
      {
        "start": 10,
        "end": 43,
        "entity": "wit$location",
        "value": "11 Juniper Drive, Cedar Knolls NJ"
      }
    ]
  },
  {
    "text": "I live at 221 S 5th Ave, Highland Park, NJ 08904",
    "intent": "settings.default_location",
    "entities": [
      {
        "start": 10,
        "end": 48,
        "entity": "wit$location",
        "value": "221 S 5th Ave, Highland Park, NJ 08904"
      }
    ]
  },
  {
    "text": "i live at 616 W 184th street new york city",
    "intent": "settings.default_location",
    "entities": [
      {
        "start": 10,
        "end": 42,
        "entity": "wit$location",
        "value": "616 W 184th street new york city"
      }
    ]
  },
  {
    "text": "my home is at 616 West 184th Street, New York City, New York",
    "intent": "settings.default_location",
    "entities": [
      {
        "start": 14,
        "end": 60,
        "entity": "wit$location",
        "value": "616 West 184th Street, New York City, New York"
      }
    ]
  },
  {
    "text": "Change my default address",
    "intent": "settings.default_location",
    "entities": []
  },
  {
    "text": "my home address is 55 duke street new brunswick nj",
    "intent": "settings.default_location",
    "entities": [
      {
        "start": 19,
        "end": 50,
        "entity": "wit$location",
        "value": "55 duke street new brunswick nj"
      }
    ]
  },
  {
    "text": "my address is 616 W 184th street",
    "intent": "settings.default_location",
    "entities": []
  },
  {
    "text": "I live at 221 S 5th Ave, Highland Park, NJ",
    "intent": "settings.default_location",
    "entities": [
      {
        "start": 10,
        "end": 42,
        "entity": "wit$location",
        "value": "221 S 5th Ave, Highland Park, NJ"
      }
    ]
  },
  {
    "text": "I dont live there",
    "intent": "settings.default_location",
    "entities": []
  }
];
