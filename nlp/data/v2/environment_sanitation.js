module.exports = [
  {
    "text": "Do do you have any information about black bears?",
    "intent": "environment_sanitation.environment_bear_info",
    "entities": [
      {
        "start": 43,
        "end": 48,
        "value": "environment_sanitation",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "What should I know about black bears?",
    "intent": "environment_sanitation.environment_bear_info",
    "entities": []
  },
  {
    "text": "It looks like theres oil on the water",
    "intent": "environment_sanitation.environment_waterway.report",
    "entities": [
      {
        "start": 32,
        "end": 37,
        "value": "environment_sanitation",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "The river looks weird",
    "intent": "environment_sanitation.environment_waterway.report",
    "entities": [
      {
        "start": 4,
        "end": 9,
        "value": "environment_sanitation",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "The river looks dirty",
    "intent": "environment_sanitation.environment_waterway.report",
    "entities": []
  },
  {
    "text": "Can I bring alcohol to the park?",
    "intent": "environment_sanitation.park_alcohol",
    "entities": [
      {
        "start": 27,
        "end": 31,
        "value": "environment_sanitation",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "Can I barbecue in the park?",
    "intent": "environment_sanitation.park_barbecue",
    "entities": []
  },
  {
    "text": "Are grills allowed in the park?",
    "intent": "environment_sanitation.park_barbecue",
    "entities": []
  },
  {
    "text": "Can I bring my dog to the park?",
    "intent": "environment_sanitation.park_pets",
    "entities": []
  },
  {
    "text": "Is it ok to bring a dog to the park?",
    "intent": "environment_sanitation.park_pets",
    "entities": []
  },
  {
    "text": "Can dogs be at the park?",
    "intent": "environment_sanitation.park_pets",
    "entities": []
  },
  {
    "text": "Am I allowed to bring a dog to a park?",
    "intent": "environment_sanitation.park_pets",
    "entities": []
  },
  {
    "text": "Can I reserve a park or picnic area?",
    "intent": "environment_sanitation.park_reservations",
    "entities": [
      {
        "start": 24,
        "end": 30,
        "value": "environment_sanitation",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "How do I reserve a section at the park for a party?",
    "intent": "environment_sanitation.park_reservations",
    "entities": []
  },
  {
    "text": "How do I reserve a park pavilion?",
    "intent": "environment_sanitation.park_reservations",
    "entities": []
  },
  {
    "text": "How do I reserve a sports field?",
    "intent": "environment_sanitation.park_reservations",
    "entities": [
      {
        "start": 19,
        "end": 31,
        "value": "environment_sanitation",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "Can I smoke in the park?",
    "intent": "environment_sanitation.park_smoking",
    "entities": []
  },
  {
    "text": "I'm having an problem at the park",
    "intent": "environment_sanitation.park.report",
    "entities": []
  },
  {
    "text": "There's a problem at the park",
    "intent": "environment_sanitation.park.report",
    "entities": []
  },
  {
    "text": "How do I report someone who does not clean up after their dog?",
    "intent": "environment_sanitation.report_pet_cleanup",
    "entities": []
  },
  {
    "text": "This person isn't cleaning up after their dog",
    "intent": "environment_sanitation.report_pet_cleanup",
    "entities": []
  },
  {
    "text": "This owner is leaving dog poop",
    "intent": "environment_sanitation.report_pet_cleanup",
    "entities": []
  },
  {
    "text": "I need to throw stuff out",
    "intent": "environment_sanitation.disposal",
    "entities": [],
    "meta": {
      "vague": true
    }
  },
  {
    "text": "tossing stuff out",
    "intent": "environment_sanitation.disposal",
    "entities": [],
    "meta": {
      "vague": true
    }
  },
  {
    "text": "How do I dispose of appliances?",
    "intent": "environment_sanitation.disposal.appliance",
    "entities": [
      {
        "start": 9,
        "end": 16,
        "value": "environment_sanitation",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "How do I throw out my appliances?",
    "intent": "environment_sanitation.disposal.appliance",
    "entities": [
      {
        "start": 9,
        "end": 18,
        "value": "environment_sanitation",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "I want to get rid of appliances",
    "intent": "environment_sanitation.disposal.appliance",
    "entities": []
  },
  {
    "text": "I want to thow out an air conditioner",
    "intent": "environment_sanitation.disposal.appliance",
    "entities": []
  },
  {
    "text": "How do I get rid of an air conditioner?",
    "intent": "environment_sanitation.disposal.appliance",
    "entities": []
  },
  {
    "text": "My air conditioner is broken",
    "intent": "environment_sanitation.disposal.appliance",
    "entities": []
  },
  {
    "text": "How do I dispose of batteries?",
    "intent": "environment_sanitation.disposal.battery",
    "entities": []
  },
  {
    "text": "What do I need to do about throwing out batteries",
    "intent": "environment_sanitation.disposal.battery",
    "entities": []
  },
  {
    "text": "How do I throw out a large metal item?",
    "intent": "environment_sanitation.disposal.metal",
    "entities": []
  },
  {
    "text": "I'm trying to get rid of a big metal item?",
    "intent": "environment_sanitation.disposal.metal",
    "entities": [
      {
        "start": 14,
        "end": 24,
        "value": "environment_sanitation",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "How can I request bulk item pickup?",
    "intent": "environment_sanitation.disposal.bulk_pickup",
    "entities": []
  },
  {
    "text": "How do I get bulk pickup?",
    "intent": "environment_sanitation.disposal.bulk_pickup",
    "entities": []
  },
  {
    "text": "I need bulk pickup",
    "intent": "environment_sanitation.disposal.bulk_pickup",
    "entities": []
  },
  {
    "text": "How do I dispose of a carpet?",
    "intent": "environment_sanitation.disposal.carpet",
    "entities": []
  },
  {
    "text": "How do I get rid of a carpet?",
    "intent": "environment_sanitation.disposal.carpet",
    "entities": []
  },
  {
    "text": "I need to throw out my carpet?",
    "intent": "environment_sanitation.disposal.carpet",
    "entities": []
  },
  {
    "text": "I want to throw out my couch",
    "intent": "environment_sanitation.disposal.furniture",
    "entities": []
  },
  {
    "text": "I need to get rid of my sofa?",
    "intent": "environment_sanitation.disposal.furniture",
    "entities": []
  },
  {
    "text": "How do I throw out my futon?",
    "intent": "environment_sanitation.disposal.furniture",
    "entities": []
  },
  {
    "text": "Is composting allowed?",
    "intent": "environment_sanitation.compost",
    "entities": []
  },
  {
    "text": "Can I compost?",
    "intent": "environment_sanitation.compost",
    "entities": []
  },
  {
    "text": "What do I do with compost?",
    "intent": "environment_sanitation.compost",
    "entities": []
  },
  {
    "text": "When do you collect compost?",
    "intent": "environment_sanitation.compost.schedule",
    "entities": []
  },
  {
    "text": "Where can I dispose of electronics?",
    "intent": "environment_sanitation.disposal.electronics",
    "entities": []
  },
  {
    "text": "How do I dispose of a lawn mower?",
    "intent": "environment_sanitation.disposal.lawn_mower",
    "entities": []
  },
  {
    "text": "How should leaves be handled?",
    "intent": "environment_sanitation.disposal.leaf",
    "entities": []
  },
  {
    "text": "What do I do about leaves?",
    "intent": "environment_sanitation.disposal.leaf",
    "entities": []
  },
  {
    "text": "Do I need to bag my leaves?",
    "intent": "environment_sanitation.disposal.leaf",
    "entities": []
  },
  {
    "text": "Do I brush leaves to the curb?",
    "intent": "environment_sanitation.disposal.leaf",
    "entities": []
  },
  {
    "text": "How do I dispose of my mattress?",
    "intent": "environment_sanitation.disposal.mattress",
    "entities": []
  },
  {
    "text": "Where do I find a mattress disposal bag?",
    "intent": "environment_sanitation.mattress_disposal_bag",
    "entities": []
  },
  {
    "text": "Where do I throw out paint?",
    "intent": "environment_sanitation.disposal.paint",
    "entities": []
  },
  {
    "text": "How do I throw out paint?",
    "intent": "environment_sanitation.disposal.paint",
    "entities": []
  },
  {
    "text": "How do I throw out a piano?",
    "intent": "environment_sanitation.disposal.piano",
    "entities": []
  },
  {
    "text": "How do I get rid of a piano?",
    "intent": "environment_sanitation.disposal.piano",
    "entities": []
  },
  {
    "text": "i have garbage",
    "intent": "environment_sanitation.trash",
    "entities": [],
    "meta": {
      "vague": true
    }
  },
  {
    "text": "What day is trash pickup?",
    "intent": "environment_sanitation.trash.schedule",
    "entities": [
      {
        "start": 12,
        "end": 17,
        "value": "environment_sanitation",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "Is garbage picked up tomorrow?",
    "intent": "environment_sanitation.trash.schedule",
    "entities": [
      {
        "start": 3,
        "end": 10,
        "value": "environment_sanitation",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "When is trash pickup?",
    "intent": "environment_sanitation.trash.schedule",
    "entities": []
  },
  {
    "text": "Is there trash pickup next week?",
    "intent": "environment_sanitation.trash.schedule",
    "entities": []
  },
  {
    "text": "Is there garbage pickup next week?",
    "intent": "environment_sanitation.trash.schedule",
    "entities": []
  },
  {
    "text": "Is trash pickup next Tuesday?",
    "intent": "environment_sanitation.trash.schedule",
    "entities": []
  },
  {
    "text": "What is the trash schedule?",
    "intent": "environment_sanitation.trash.schedule",
    "entities": []
  },
  {
    "text": "What day is trash? ",
    "intent": "environment_sanitation.trash.schedule",
    "entities": []
  },
  {
    "text": "Garbage Schedule",
    "intent": "environment_sanitation.trash.schedule",
    "entities": []
  },
  {
    "text": "my garbage schedule",
    "intent": "environment_sanitation.trash.schedule",
    "entities": []
  },
  {
    "text": "Where do I dispose of my garbage?",
    "intent": "environment_sanitation.trash.location",
    "entities": []
  },

  {
    "text": "Animals keep eating my garbage",
    "intent": "environment_sanitation.trash.animals",
    "entities": [
      {
        "start": 1,
        "end": 7,
        "value": "environment_sanitation",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "Rodents keep eating the garbage",
    "intent": "environment_sanitation.trash.animals",
    "entities": [
      {
        "start": 1,
        "end": 7,
        "value": "environment_sanitation",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "How do I stop animals from eating my garbage?",
    "intent": "environment_sanitation.trash.animals",
    "entities": []
  },
  {
    "text": "How do I report a waterway that is an unusual color?",
    "intent": "environment_sanitation.environment_waterway.report",
    "entities": [
      {
        "start": 18,
        "end": 26,
        "value": "environment_sanitation",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "Do I need special bins for recycling?",
    "intent": "environment_sanitation.recycling.bins",
    "entities": [
      {
        "start": 18,
        "end": 22,
        "value": "environment_sanitation",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "Can I use a blue recycling bin instead of the standard ones?",
    "intent": "environment_sanitation.recycling.bins",
    "entities": []
  },
  {
    "text": "Can recycling be mixed?",
    "intent": "environment_sanitation.recycling.mix",
    "entities": [
      {
        "start": 4,
        "end": 13,
        "value": "environment_sanitation",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "Does recycling need to be separated?",
    "intent": "environment_sanitation.recycling.mix",
    "entities": []
  },
  {
    "text": "Do we recycle?",
    "intent": "environment_sanitation.recycling",
    "entities": [],
    "meta": {
      "vague": true
    }
  },
  {
    "text": "recycle?",
    "intent": "environment_sanitation.recycling",
    "entities": [],
    "meta": {
      "vague": true
    }
  },
  {
    "text": "Where do I dispose of my recycling?",
    "intent": "environment_sanitation.recycling.location",
    "entities": []
  },
  {
    "text": "Where do I bring recycling?",
    "intent": "environment_sanitation.recycling.location",
    "entities": []
  },
  {
    "text": "Which day is recycling?",
    "intent": "environment_sanitation.recycling.schedule",
    "entities": []
  },
  {
    "text": "When is recycling?",
    "intent": "environment_sanitation.recycling.schedule",
    "entities": []
  },
  {
    "text": "What is the recycling schedule?",
    "intent": "environment_sanitation.recycling.schedule",
    "entities": []
  },
  {
    "text": "Is there recycling next week?",
    "intent": "environment_sanitation.recycling.schedule",
    "entities": []
  },
  {
    "text": "Is recycling next Wednesday?",
    "intent": "environment_sanitation.recycling.schedule",
    "entities": []
  },
  {
    "text": "When is recycling next month?",
    "intent": "environment_sanitation.recycling.schedule",
    "entities": []
  },
  {
    "text": "Recycling Schedule",
    "intent": "environment_sanitation.recycling.schedule",
    "entities": []
  },
  {
    "text": "my recycling schedule",
    "intent": "environment_sanitation.recycling.schedule",
    "entities": []
  },
  {
    "text": "Where do I dispose used syringes?",
    "intent": "environment_sanitation.sanitation_syringes",
    "entities": []
  },
  {
    "text": "Where do I bring syringes?",
    "intent": "environment_sanitation.sanitation_syringes",
    "entities": []
  },
  {
    "text": "Where do I throw out used syringes??",
    "intent": "environment_sanitation.sanitation_syringes",
    "entities": []
  },
  {
    "text": "i need to get rid of syringes",
    "intent": "environment_sanitation.sanitation_syringes",
    "entities": []
  },
  {
    "text": "How do I contact a wastewater treatment plant?",
    "intent": "environment_sanitation.sanitation_wastewater_facility.contact",
    "entities": []
  },
  {
    "text": "plastic",
    "entities": [
      {
        "start": 1,
        "end": 7,
        "value": "environment_sanitation",
        "entity": "category_keywords"
      }
    ]
  },
];