module.exports = [
  {
    "text": "Where can I get confidential health screenings or testing for STDs?",
    "intent": "health_medicine.health_std_testing",
    "entities": []
  },
  {
    "text": "How do I know if I have a STD",
    "intent": "health_medicine.health_std_testing",
    "entities": []
  },
  {
    "text": "Where do I get STD testing",
    "intent": "health_medicine.health_std_testing",
    "entities": [
      {
        "start": 15,
        "end": 18,
        "value": "health_medicine",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "Who tests for HIV",
    "intent": "health_medicine.health_std_testing",
    "entities": [
      {
        "start": 14,
        "end": 17,
        "value": "health_medicine",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "How much does TB testing cost at a City clinic or hospital?",
    "intent": "health_medicine.health_tb_testing",
    "entities": [
      {
        "start": 14,
        "end": 16,
        "value": "health_medicine",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "how much is a TB test?",
    "intent": "health_medicine.health_tb_testing",
    "entities": []
  },
  {
    "text": "How do I pay my ambulance bill?",
    "intent": "health_medicine.payments_ambulance_inquiry",
    "entities": [
      {
        "start": 16,
        "end": 25,
        "value": "health_medicine",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "How do I report a dead animal on the road?",
    "intent": "health_medicine.animal_dead.report",
    "entities": []
  },
  {
    "text": "I found a dead animal",
    "intent": "health_medicine.animal_dead.report",
    "entities": []
  },
  {
    "text": "Theres a dead deer on the side of the road",
    "intent": "health_medicine.animal_dead.report",
    "entities": []
  },
  {
    "text": "I ate a resturaunt and got sick. What should I do?",
    "intent": "health_medicine.food_conditions.report",
    "entities": []
  },
  {
    "text": "How do I report an unsafe condition in a restaurant?",
    "intent": "health_medicine.food_conditions.report",
    "entities": []
  },
  {
    "text": "I just got food poisioning from a resturaunt",
    "intent": "health_medicine.food_conditions.report",
    "entities": [
      {
        "start": 11,
        "end": 26,
        "value": "health_medicine",
        "entity": "category_keywords"
      },
      {
        "start": 34,
        "end": 44,
        "value": "business_finance",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "What vaccines should a child get?",
    "intent": "health_medicine.vacination_children",
    "entities": [
      {
        "start": 5,
        "end": 13,
        "value": "health_medicine",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "What is a recommended children's vacination schedule?",
    "intent": "health_medicine.vacination_children",
    "entities": [
      {
        "start": 33,
        "end": 43,
        "value": "health_medicine",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "What should I do if a bat landed on me?",
    "intent": "health_medicine.animal_bat_contact",
    "entities": []
  },
  {
    "text": "What should I do if a bat bit me?",
    "intent": "health_medicine.animal_bat_contact",
    "entities": []
  },
  {
    "text": "What should I do if a bat is in my house?",
    "intent": "health_medicine.animal_bat_trapped",
    "entities": []
  },
  {
    "text": "There's a bat in my house",
    "intent": "health_medicine.animal_bat_trapped",
    "entities": []
  },
  {
    "text": "a bat is in the house",
    "intent": "health_medicine.animal_bat_trapped",
    "entities": []
  },
  {
    "text": "What animals do I have to worry about having rabbies?",
    "intent": "health_medicine.animal_rabbies_found",
    "entities": []
  },
  {
    "text": "What animals usually have rabbies?",
    "intent": "health_medicine.animal_rabbies_found",
    "entities": []
  },
  {
    "text": "What does a rabid animal look like?",
    "intent": "health_medicine.animal_rabbies_signs",
    "entities": []
  },
  {
    "text": "How do I know if my pet has rabies",
    "intent": "health_medicine.animal_rabbies_signs",
    "entities": []
  },
  {
    "text": "Could my pet have been exposed to rabbies?",
    "intent": "health_medicine.animal_rabbies_signs",
    "entities": []
  },
  {
    "text": "my pet might have rabbies",
    "intent": "health_medicine.animal_rabbies_signs",
    "entities": [
      {
        "start": 18,
        "end": 25,
        "value": "health_medicine",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "Where can I find a health clinic or basic medical care?",
    "intent": "health_medicine.clinics",
    "entities": []
  },
  {
    "text": "Where can I find free medical help",
    "intent": "health_medicine.clinics",
    "entities": []
  },
  {
    "text": "Open clinics",
    "intent": "health_medicine.clinics",
    "entities": [
      {
        "start": 0,
        "end": 4,
        "value": "open_now",
        "entity": "schedule"
      },
      {
        "start": 5,
        "end": 12,
        "value": "health_medicine",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "open clinics nearby",
    "intent": "health_medicine.clinics",
    "entities": [
      {
        "start": 0,
        "end": 4,
        "value": "open_now",
        "entity": "schedule"
      }
    ]
  },
  {
    "text": "I need a doctor",
    "intent": "health_medicine.clinics",
    "entities": [
      {
        "start": 9,
        "end": 15,
        "value": "health_medicine",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "How do I get guides to healthy living?",
    "intent": "health_medicine.health_guides",
    "entities": []
  },
  {
    "text": "I want to be healthier",
    "intent": "health_medicine.health_guides",
    "entities": []
  },
  {
    "text": "How can I get healthier?",
    "intent": "health_medicine.health_guides",
    "entities": []
  },
  {
    "text": "Mosquito Spraying Schedule",
    "intent": "health_medicine.mosquito_spraying_schedule",
    "entities": []
  },
  {
    "text": "when do you spray for mosquitos?",
    "intent": "health_medicine.mosquito_spraying_schedule",
    "entities": []
  },
  {
    "text": "are you spraying mosquitos?",
    "intent": "health_medicine.mosquito_spraying_schedule",
    "entities": []
  },
];
