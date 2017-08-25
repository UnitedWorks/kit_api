module.exports = [
  {
    "text": "Am I allowed to knock on doors and hand out informational brochures?",
    "intent": "business_finance.advertising_door_to_door",
    "entities": []
  },
  {
    "text": "Can I sell door to door?",
    "intent": "business_finance.advertising_door_to_door",
    "entities": [
      {
        "start": 6,
        "end": 10,
        "value": "business_finance",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "Can I sell my product door to door?",
    "intent": "business_finance.advertising_door_to_door",
    "entities": []
  },
  {
    "text": "Do I need to tell someone if I want to sell door to door?",
    "intent": "business_finance.advertising_door_to_door",
    "entities": []
  },
  {
    "text": "Do I need to let the local government know about going door to door?",
    "intent": "business_finance.advertising_door_to_door",
    "entities": []
  },
  {
    "text": "What permit do I need to build a billboard?",
    "intent": "business_finance.advertising_billboard_requirements",
    "entities": []
  },
  {
    "text": "I want to build a billboard. What do I need to do?",
    "intent": "business_finance.advertising_billboard_requirements",
    "entities": []
  },
  {
    "text": "What signs are contractors allowed to place between the street and sidewalk?",
    "intent": "business_finance.advertising_yard_signs",
    "entities": [
      {
        "start": 15,
        "end": 26,
        "value": "business_finance",
        "entity": "category_keywords"
      },
      {
        "start": 56,
        "end": 62,
        "value": "transportation_streets_sidewalks",
        "entity": "category_keywords"
      },
      {
        "start": 67,
        "end": 75,
        "value": "transportation_streets_sidewalks",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "Can I place a sign between the street and sidewalk?",
    "intent": "business_finance.advertising_yard_signs",
    "entities": []
  },
  {
    "text": "Is it ok to put a sign on someone's yard I'm doing work for?",
    "intent": "business_finance.advertising_yard_signs",
    "entities": [
      {
        "start": 36,
        "end": 40,
        "value": "property_buildings_homes",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "When can't I put a sign on a person's yard?",
    "intent": "business_finance.advertising_yard_signs",
    "entities": [
      {
        "start": 38,
        "end": 42,
        "value": "property_buildings_homes",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "What are construction workers required to list on their vehicles?",
    "intent": "business_finance.business_vehicles_markings",
    "entities": [
      {
        "start": 9,
        "end": 29,
        "value": "business_finance",
        "entity": "category_keywords"
      },
      {
        "start": 56,
        "end": 64,
        "value": "transportation_streets_sidewalks",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "Do company vehicles need any special markings or signs?",
    "intent": "business_finance.business_vehicles_markings",
    "entities": []
  },
  {
    "text": "How do I check if a business has a history of complaints?",
    "intent": "business_finance.business_complaint_history",
    "entities": [
      {
        "start": 20,
        "end": 28,
        "value": "business_finance",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "Where can I get a history of complaints about a business?",
    "intent": "business_finance.business_complaint_history",
    "entities": []
  },
  {
    "text": "Where can I get a business's work history?",
    "intent": "business_finance.business_complaint_history",
    "entities": [
      {
        "start": 18,
        "end": 28,
        "value": "business_finance",
        "entity": "category_keywords"
      },
      {
        "start": 29,
        "end": 41,
        "value": "business_finance",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "How do I learn about a business's past performance?",
    "intent": "business_finance.business_complaint_history",
    "entities": [
      {
        "start": 34,
        "end": 50,
        "value": "business_finance",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "A contractor did a poor job, who do I contact?",
    "intent": "business_finance.business_contractor_poor_work",
    "entities": []
  },
  {
    "text": "How do I report a contractor?",
    "intent": "business_finance.business_contractor_poor_work",
    "entities": []
  },
  {
    "text": "I hired someone to fix my house and they totally screwed it up. Who do I tell?",
    "intent": "business_finance.business_contractor_poor_work",
    "entities": []
  },
  {
    "text": "What license or permit do I need for a food cart?",
    "intent": "business_finance.business_food_cart_requirements",
    "entities": [
      {
        "start": 39,
        "end": 48,
        "value": "business_finance",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "What do I need to run a food cart?",
    "intent": "business_finance.business_food_cart_requirements",
    "entities": []
  },
  {
    "text": "I'm looking to open a food cart. What do I need to do?",
    "intent": "business_finance.business_food_cart_requirements",
    "entities": []
  },
  {
    "text": "I need a permit for my resturaunt",
    "intent": "business_finance.business_food_service_permit",
    "entities": [],
  },
  {
    "text": "Food  Service  Permits",
    "intent": "business_finance.business_food_service_permit",
    "entities": [],
  },
  {
    "text": "How do I check if a business is licensed?",
    "intent": "business_finance.business_licenses.check",
    "entities": []
  },
  {
    "text": "Can you check if a business is licensed?",
    "intent": "business_finance.business_licenses.check",
    "entities": []
  },
  {
    "text": "Check a contractor license",
    "intent": "business_finance.business_licenses.check",
    "entities": []
  },
  {
    "text": "I don't think this business is licensed",
    "intent": "business_finance.business_licenses.check",
    "entities": []
  },
  {
    "text": "How do I get a business or merchants license?",
    "intent": "business_finance.business_licenses.get",
    "entities": [
      {
        "start": 27,
        "end": 44,
        "value": "business_finance",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "How can i get a business license?",
    "intent": "business_finance.business_licenses.get",
    "entities": []
  },
  {
    "text": "Where do I get a permit for my business?",
    "intent": "business_finance.business_licenses.get",
    "entities": []
  },
  {
    "text": "Does the city need to know about my business?",
    "intent": "business_finance.business_licenses.get",
    "entities": []
  },
  {
    "text": "Does the city need to know about my business?",
    "intent": "business_finance.business_licenses.get",
    "entities": []
  },
  {
    "text": "Get a Business License",
    "intent": "business_finance.business_licenses.get",
    "entities": []
  },
  {
    "text": "How late can a bar or club stay open?",
    "intent": "business_finance.business_nightlife_hours",
    "entities": []
  },
  {
    "text": "When do bars need to close by?",
    "intent": "business_finance.business_nightlife_hours",
    "entities": []
  },
  {
    "text": "Is there a plastic bag ban or charge?",
    "intent": "business_finance.business_plastic_bag_status",
    "entities": []
  },
  {
    "text": "Do I charge extra for plastic bags?",
    "intent": "business_finance.business_plastic_bag_status",
    "entities": []
  },
  {
    "text": "What are the rules for external restaurant exhaust duct placement?",
    "intent": "business_finance.business_restaurant_duct_requirements",
    "entities": []
  },
  {
    "text": "Where can I put my restaurant's exhaust duct?",
    "intent": "business_finance.business_restaurant_duct_requirements",
    "entities": []
  },
  {
    "text": "Does it matter where I put a restaurant exhaust?",
    "intent": "business_finance.business_restaurant_duct_requirements",
    "entities": []
  },
  {
    "text": "How do I renew my restaurant permit?",
    "intent": "business_finance.business_licenses_restaurant.renew",
    "entities": []
  },
  {
    "text": "Where do I renew my restaurant permit?",
    "intent": "business_finance.business_licenses_restaurant.renew",
    "entities": []
  },
  {
    "text": "What license or permit do I need for a restaurant?",
    "intent": "business_finance.business_requirements_restaurant",
    "entities": []
  },
  {
    "text": "What are the rules for signs in front of businesses?",
    "intent": "business_finance.business_signage_rules",
    "entities": []
  },
  {
    "text": "Do I need anything to put a sign outside my store?",
    "intent": "business_finance.business_signage_rules",
    "entities": []
  },
  {
    "text": "Can I put a sign up on my business?",
    "intent": "business_finance.business_signage_rules",
    "entities": []
  },
  {
    "text": "How does the town help small businesses?",
    "intent": "business_finance.business_assistance_small_business",
    "entities": [
      {
        "start": 23,
        "end": 39,
        "value": "business_finance",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "Where can I find resources for small businesses?",
    "intent": "business_finance.business_assistance_small_business",
    "entities": []
  },
  {
    "text": "Can the city help my business?",
    "intent": "business_finance.business_assistance_small_business",
    "entities": []
  },
  {
    "text": "Can you help me with my business?",
    "intent": "business_finance.business_assistance_small_business",
    "entities": []
  },
  {
    "text": "How do I get help starting or expanding my small business?",
    "intent": "business_finance.business_assistance_small_business",
    "entities": [
      {
        "start": 43,
        "end": 57,
        "value": "business_finance",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "how do i open a business",
    "intent": "business_finance.business_assistance_small_business",
    "entities": []
  },
  {
    "text": "How do I open a small business?",
    "intent": "business_finance.business_assistance_small_business",
    "entities": []
  },
  {
    "text": "Small business loans",
    "intent": "business_finance.business_assistance_small_business",
    "entities": []
  },
  {
    "text": "Is it legal to play music on the street?",
    "intent": "business_finance.business_street_musician_requirements",
    "entities": []
  },
  {
    "text": "Can I play music on the street?",
    "intent": "business_finance.business_street_musician_requirements",
    "entities": []
  },
  {
    "text": "I want to play music on the street",
    "intent": "business_finance.business_street_musician_requirements",
    "entities": []
  },
  {
    "text": "where can I play music in public",
    "intent": "business_finance.business_street_musician_requirements",
    "entities": []
  },
  {
    "text": "How do I apply for a license to sell items on the street?",
    "intent": "business_finance.business_street_vendor_requirements",
    "entities": []
  },
  {
    "text": "Do I need to do anything to sell on the sidewalk?",
    "intent": "business_finance.business_street_vendor_requirements",
    "entities": []
  },
  {
    "text": "Can I sell things on the sidewalk?",
    "intent": "business_finance.business_street_vendor_requirements",
    "entities": []
  },
  {
    "text": "I want to be a street vendor",
    "intent": "business_finance.business_street_vendor_requirements",
    "entities": [
      {
        "start": 15,
        "end": 28,
        "value": "business_finance",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "How do I change my business name or address to correct my business tax records?",
    "intent": "business_finance.business_tax_record_updating",
    "entities": []
  },
  {
    "text": "How do I change my business name?",
    "intent": "business_finance.business_tax_record_updating",
    "entities": []
  },
  {
    "text": "My business is moving",
    "intent": "business_finance.business_tax_record_updating",
    "entities": []
  },
  {
    "text": "I need to fix my business tax records",
    "intent": "business_finance.business_tax_record_updating",
    "entities": []
  },
  {
    "text": "How do I report a tattoo artist who is unlicensed or unsafe?",
    "intent": "business_finance.business_tattoos.report",
    "entities": []
  },
  {
    "text": "this tattoo artist is using dirty needles",
    "intent": "business_finance.business_tattoos.report",
    "entities": []
  },
  {
    "text": "How do I report a commercial vehicle parked on residential property?",
    "intent": "business_finance.business_vehicles.report",
    "entities": []
  },
  {
    "text": "This truck is blocking the entire road while unloading",
    "intent": "business_finance.business_vehicles.report",
    "entities": []
  },
  {
    "text": "How does my company become one of your approved vendors?",
    "intent": "business_finance.procurement_vendors_approved",
    "entities": []
  },
  {
    "text": "How do I apply to be an approved vendor?",
    "intent": "business_finance.procurement_vendors_approved",
    "entities": [
      {
        "start": 33,
        "end": 39,
        "value": "business_finance",
        "entity": "category_keywords"
      }
    ]
  },
  {
    "text": "How can my business work with the city?",
    "intent": "business_finance.procurement_inquiry",
    "entities": []
  },
  {
    "text": "How do I get a city contract?",
    "intent": "business_finance.procurement_inquiry",
    "entities": [
      {
        "start": 20,
        "end": 28,
        "value": "business_finance",
        "entity": "category_keywords"
      }
    ]
  }
];
