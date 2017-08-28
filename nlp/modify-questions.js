// Setup
require('babel-core/register');
require('babel-polyfill');
require('../api/env').setup();
const knex = require('../api/orm').knex;

const updateOperations = [
  // Business
  {
    from: 'business_finance.business_assistance_small_business.start',
    to: 'business_finance.business_assistance_small_business',
  },
  {
    from: 'business_finance.business_wage_theft',
    to: 'education_employment.wage_theft',
  },
  // Property
  {
    from: 'property_buildings_homes.home_occupancy_max',
    to: 'property_buildings_homes.home_max_occupancy',
  },
  // Sanitation
  {
    from: 'environment_sanitation.sanitation_recycling',
    to: 'environment_sanitation.recycling',
  },
  {
    from: 'environment_sanitation.sanitation_recycling_bins',
    to: 'environment_sanitation.recycling.bins',
  },
  {
    from: 'environment_sanitation.sanitation_recycling_location',
    to: 'environment_sanitation.recycling.location',
  },
  {
    from: 'environment_sanitation.sanitation_recycling_mix',
    to: 'environment_sanitation.recycling.mix',
  },
  {
    from: 'environment_sanitation.sanitation_recycling_schedule',
    to: 'environment_sanitation.recycling.schedule',
  },
  {
    from: 'environment_sanitation.sanitation_disposal_leaf',
    to: 'environment_sanitation.disposal.leaf',
  },
  {
    from: 'environment_sanitation.sanitation_leaf_disposal',
    to: 'environment_sanitation.disposal.leaf',
  },
  {
    from: 'environment_sanitation.sanitation_disposal_lawn_mower',
    to: 'environment_sanitation.disposal.lawn_mower',
  },
  {
    from: 'environment_sanitation.sanitation_lawn_mower',
    to: 'environment_sanitation.disposal.lawn_mower',
  },
  {
    from: 'environment_sanitation.sanitation_disposal_mattress',
    to: 'environment_sanitation.disposal.mattress',
  },
  {
    from: 'environment_sanitation.sanitation_mattress_disposal',
    to: 'environment_sanitation.disposal.mattress',
  },
  {
    from: 'environment_sanitation.sanitation_mattress_disposal',
    to: 'environment_sanitation.disposal.mattress',
  },
  {
    from: 'environment_sanitation.sanitation_mattress_disposal_bag',
    to: 'environment_sanitation.mattress_disposal_bag',
  },
  {
    from: 'environment_sanitation.sanitation_paint_disposal',
    to: 'environment_sanitation.disposal.paint',
  },
  {
    from: 'environment_sanitation.sanitation_piano_disposal ',
    to: 'environment_sanitation.disposal.piano',
  },
  {
    from: 'environment_sanitation.sanitation_piano_disposal',
    to: 'environment_sanitation.disposal.piano',
  },
  {
    from: 'environment_sanitation.sanitation_disposal_electronics',
    to: 'environment_sanitation.disposal.electronics',
  },
  {
    from: 'environment_sanitation.sanitation_electronics_disposal',
    to: 'environment_sanitation.disposal.electronics',
  },
  {
    from: 'environment_sanitation.sanitation_disposal_furniture',
    to: 'environment_sanitation.disposal.furniture',
  },
  {
    from: 'environment_sanitation.sanitation_disposal_carpet',
    to: 'environment_sanitation.disposal.carpet',
  },
  {
    from: 'environment_sanitation.sanitation_disposal_appliance',
    to: 'environment_sanitation.disposal.appliance',
  },
  {
    from: 'environment_sanitation.sanitation_disposal_battery',
    to: 'environment_sanitation.disposal.battery',
  },
  {
    from: 'environment_sanitation.sanitation_disposal_metal',
    to: 'environment_sanitation.disposal.metal',
  },
  {
    from: 'environment_sanitation.sanitation_bulk_pickup',
    to: 'environment_sanitation.disposal.bulk_pickup',
  },
  {
    from: 'environment_sanitation.sanitation_compost',
    to: 'environment_sanitation.compost',
  },
  {
    from: 'environment_sanitation.sanitation_compost_schedule',
    to: 'environment_sanitation.compost.schedule',
  },
  // Transportation
  {
    from: 'transportation_streets_sidewalks.parking_map',
    to: 'transportation_streets_sidewalks.map',
  },
  {
    from: 'transportation_streets_sidewalks.parking_meter_map',
    to: 'transportation_streets_sidewalks.map.parking_meters',
  },
  {
    from: 'transportation_streets_sidewalks.street_sign_map',
    to: 'transportation_streets_sidewalks.map.street_signs',
  },
  {
    from: 'transportation_streets_sidewalks.parking_information',
    to: 'transportation_streets_sidewalks.parking',
  },
  {
    from: 'transportation_streets_sidewalks.parking_disability_permit',
    to: 'transportation_streets_sidewalks.parking.disability_permit',
  },
  {
    from: 'transportation_streets_sidewalks.parking_residential_permit_request',
    to: 'transportation_streets_sidewalks.parking.residential_permit_request',
  },
  {
    from: 'transportation_streets_sidewalks.parking_residential_permit_numbers',
    to: 'transportation_streets_sidewalks.parking.residential_permit_numbers',
  },
  {
    from: 'transportation_streets_sidewalks.parking_rules_asp_sweeper',
    to: 'transportation_streets_sidewalks.parking.asp_sweeper',
  },
  {
    from: 'transportation_streets_sidewalks.parking_rules_asp_double',
    to: 'transportation_streets_sidewalks.parking.asp_double',
  },
  {
    from: 'transportation_streets_sidewalks.parking_rules_asp.check',
    to: 'transportation_streets_sidewalks.parking.asp.check',
  },
  {
    from: 'transportation_streets_sidewalks.parking_rules_asp_weekends',
    to: 'transportation_streets_sidewalks.parking.asp_weekends',
  },
  {
    from: 'transportation_streets_sidewalks.parking_rules_asp',
    to: 'transportation_streets_sidewalks.parking.asp_schedule',
  },
  {
    from: 'transportation_streets_sidewalks.parking_rules_asp_info',
    to: 'transportation_streets_sidewalks.parking.asp_info',
  },
  {
    from: 'transportation_streets_sidewalks.parking_rules_overnight',
    to: 'transportation_streets_sidewalks.parking.overnight',
  },
  {
    from: 'transportation_streets_sidewalks.parking_card_balance',
    to: 'transportation_streets_sidewalks.parking_card.balance',
  },
  {
    from: 'transportation_streets_sidewalks.parking_card_problem',
    to: 'transportation_streets_sidewalks.parking_card.problem',
  },
  {
    from: 'transportation_streets_sidewalks.parking_rules_time_limit',
    to: 'transportation_streets_sidewalks.parking.time_limit',
  },
  {
    from: 'transportation_streets_sidewalks.parking_rules_school_zone',
    to: 'transportation_streets_sidewalks.parking.school_zone',
  },
  // Civil Services
  {
    from: 'government_civil_services.document_marriage_union_license_timeline',
    to: 'government_civil_services.document_marriage_union_license.timeline',
  },
  // Public Safety
  {
    delete: 'public_safety_law.document_marriage_union_license_timeline',
  },
].map((modification) => {
  // Simply update the label
  if (modification.from && modification.to) {
    return knex('knowledge_questions')
      .where({ label: modification.from })
      .update({ label: modification.to })
      .then(r => r);
  // Delete Associated Data/Answers in addition to Question
  } else if (modification.delete) {
    return knex('knowledge_questions').select()
      .where({ label: modification.delete })
      .then(model => Promise.all([
        () => {
            if (model && model.id) {
              return knex.select().where({ question_id: model.id }).from('knowledge_question_stats').del()
                .then(d => d)
              }
        },
        () => {
          if (model && model.id) {
            return knex.select().where({ question_id: model.id }).from('knowledge_answers').del()
              .then(d => d)
            }
        },
      ]).then(() => {
        return knex.select()
          .where({ label: modification.delete })
          .from('knowledge_questions')
          .del()
          .then(d => d);
      }));
  }
});

Promise.all(updateOperations).then((results) => {
  console.log(results);
}).catch((error) => {
  console.log(error);
});
