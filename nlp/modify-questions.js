// Setup
require('babel-core/register');
require('babel-polyfill');
require('../api/env').setup();
const knex = require('../api/orm').knex;

const updateOperations = [
  // Business
  { from: 'business_finance.business_assistance_small_business.start', to: 'business_finance.business_assistance_small_business' },
  { from: 'business_finance.business_wage_theft', to: 'education_employment.wage_theft' },
  // Education
  { from: 'education_employment.education_public_schools', to: 'education_employment.public_schools.list' },
  { from: 'education_employment.education_transfer', to: 'education_employment.public_schools.transfer' },
  { from: 'education_employment.education_transfer.check', to: 'education_employment.public_schools.transfer_status' },
  // Property
  { from: 'property_buildings_homes.home_occupancy_max', to: 'property_buildings_homes.home_max_occupancy' },
  // Sanitation
  { from: 'environment_sanitation.sanitation_recycling', to: 'environment_sanitation.recycling' },
  { from: 'environment_sanitation.sanitation_recycling_bins', to: 'environment_sanitation.recycling.bins' },
  { from: 'environment_sanitation.sanitation_recycling_location', to: 'environment_sanitation.recycling.location' },
  { from: 'environment_sanitation.sanitation_recycling_mix', to: 'environment_sanitation.recycling.mix' },
  { from: 'environment_sanitation.sanitation_recycling_schedule', to: 'environment_sanitation.recycling.schedule' },
  { from: 'environment_sanitation.sanitation_disposal_leaf', to: 'environment_sanitation.disposal.leaf' },
  { from: 'environment_sanitation.sanitation_leaf_disposal', to: 'environment_sanitation.disposal.leaf' },
  { from: 'environment_sanitation.sanitation_disposal_lawn_mower', to: 'environment_sanitation.disposal.lawn_mower' },
  { from: 'environment_sanitation.sanitation_lawn_mower', to: 'environment_sanitation.disposal.lawn_mower' },
  { from: 'environment_sanitation.sanitation_disposal_mattress', to: 'environment_sanitation.disposal.mattress' },
  { from: 'environment_sanitation.sanitation_mattress_disposal', to: 'environment_sanitation.disposal.mattress' },
  { from: 'environment_sanitation.sanitation_mattress_disposal', to: 'environment_sanitation.disposal.mattress' },
  { from: 'environment_sanitation.sanitation_mattress_disposal_bag', to: 'environment_sanitation.mattress_disposal_bag' },
  { from: 'environment_sanitation.sanitation_paint_disposal', to: 'environment_sanitation.disposal.paint' },
  { from: 'environment_sanitation.sanitation_piano_disposal ', to: 'environment_sanitation.disposal.piano' },
  { from: 'environment_sanitation.sanitation_piano_disposal', to: 'environment_sanitation.disposal.piano' },
  { from: 'environment_sanitation.sanitation_disposal_electronics', to: 'environment_sanitation.disposal.electronics' },
  { from: 'environment_sanitation.sanitation_electronics_disposal', to: 'environment_sanitation.disposal.electronics' },
  { from: 'environment_sanitation.sanitation_disposal_furniture', to: 'environment_sanitation.disposal.furniture' },
  { from: 'environment_sanitation.sanitation_disposal_carpet', to: 'environment_sanitation.disposal.carpet' },
  { from: 'environment_sanitation.sanitation_disposal_appliance', to: 'environment_sanitation.disposal.appliance' },
  { from: 'environment_sanitation.sanitation_disposal_battery', to: 'environment_sanitation.disposal.battery' },
  { from: 'environment_sanitation.sanitation_disposal_metal', to: 'environment_sanitation.disposal.metal' },
  { from: 'environment_sanitation.sanitation_bulk_pickup', to: 'environment_sanitation.disposal.bulk_pickup' },
  { from: 'environment_sanitation.sanitation_compost', to: 'environment_sanitation.compost' },
  { from: 'environment_sanitation.sanitation_compost_schedule', to: 'environment_sanitation.compost.schedule' },
  { from: 'environment_sanitation.sanitation_garbage_schedule', to: 'environment_sanitation.trash.schedule' },
  { from: 'environment_sanitation.sanitation_garbage_location', to: 'environment_sanitation.trash.location' },
  { from: 'environment_sanitation.sanitation_garbage_protection', to: 'environment_sanitation.trash.animals' },
  // Health
  {
    delete: 'health_medicine.health_emergency',
  },
  // Transportation
  { from: 'transportation_streets_sidewalks.parking_map', to: 'transportation_streets_sidewalks.map' },
  { from: 'transportation_streets_sidewalks.parking_meter_map', to: 'transportation_streets_sidewalks.map.parking_meters' },
  { from: 'transportation_streets_sidewalks.street_sign_map', to: 'transportation_streets_sidewalks.map.street_signs' },
  { from: 'transportation_streets_sidewalks.parking_information', to: 'transportation_streets_sidewalks.parking' },
  { from: 'transportation_streets_sidewalks.parking_disability_permit', to: 'transportation_streets_sidewalks.parking.disability_permit' },
  { from: 'transportation_streets_sidewalks.parking_residential_permit_request', to: 'transportation_streets_sidewalks.parking.residential_permit_request' },
  { from: 'transportation_streets_sidewalks.parking_residential_permit_numbers', to: 'transportation_streets_sidewalks.parking.residential_permit_numbers' },
  { from: 'transportation_streets_sidewalks.parking_rules_asp_sweeper', to: 'transportation_streets_sidewalks.parking.asp_sweeper' },
  { from: 'transportation_streets_sidewalks.parking_rules_asp_double', to: 'transportation_streets_sidewalks.parking.asp_double' },
  { from: 'transportation_streets_sidewalks.parking_rules_asp.check', to: 'transportation_streets_sidewalks.parking.asp.check' },
  { from: 'transportation_streets_sidewalks.parking_rules_asp_weekends', to: 'transportation_streets_sidewalks.parking.asp_weekends' },
  { from: 'transportation_streets_sidewalks.parking_rules_asp', to: 'transportation_streets_sidewalks.parking.asp_schedule' },
  { from: 'transportation_streets_sidewalks.parking_rules_asp_info', to: 'transportation_streets_sidewalks.parking.asp_info' },
  { from: 'transportation_streets_sidewalks.parking_rules_overnight', to: 'transportation_streets_sidewalks.parking.overnight' },
  { from: 'transportation_streets_sidewalks.parking_card_balance', to: 'transportation_streets_sidewalks.parking_card.balance' },
  { from: 'transportation_streets_sidewalks.parking_card_problem', to: 'transportation_streets_sidewalks.parking_card.problem' },
  { from: 'transportation_streets_sidewalks.parking_rules_time_limit', to: 'transportation_streets_sidewalks.parking.time_limit' },
  { from: 'transportation_streets_sidewalks.parking_rules_school_zone', to: 'transportation_streets_sidewalks.parking.school_zone' },
  {
    delete: 'transportation_streets_sidewalks.street_sweep_schedule',
  },
  // Civil Services
  { from: 'government_civil_services.document_marriage_union_license_timeline', to: 'government_civil_services.document_marriage_union_license.timeline' },
  // Public Safety
  {
    delete: 'public_safety_law.document_marriage_union_license_timeline',
  },
  // Shout Out Replacements
  { delete: 'environment_sanitation.park_reservations' },
  { delete: 'environment_sanitation.environment_waterway.report' },
  { delete: 'health_medicine.food_conditions.report' },
  { delete: 'health_medicine.animal_dead.report' },
  { delete: 'property_buildings_homes.construction_noise.report' },
  { delete: 'property_buildings_homes.illegal_driveway.report' },
  { delete: 'property_buildings_homes.home_rental_violation.report' },
  { delete: 'property_buildings_homes.home_sewage_backup.report' },
  { delete: 'property_buildings_homes.property_mold' },
  { delete: 'property_buildings_homes.neighbor_noise.report' },
  { delete: 'property_buildings_homes.property_alarm.report' },
  { delete: 'property_buildings_homes.odor.report' },
  { delete: 'property_buildings_homes.overgrowth.report' },
  { delete: 'property_buildings_homes.property_water_pressure.report' },
  { delete: 'property_buildings_homes.property_maintenance.report' },
  { delete: 'property_buildings_homes.squatting.report' },
  { delete: 'transportation_streets_sidewalks.roadwork_noise.report' },
  { delete: 'transportation_streets_sidewalks.parking.report' },
  { delete: 'transportation_streets_sidewalks.street_sign_broken.report' },
  { delete: 'transportation_streets_sidewalks.street_sign.request' },
  { delete: 'transportation_streets_sidewalks.street_sign_change.report' },
  { delete: 'transportation_streets_sidewalks.bike_lane.request' },
  { delete: 'transportation_streets_sidewalks.street_light.report' },
  { delete: 'transportation_streets_sidewalks.pothole.report' },
  { delete: 'transportation_streets_sidewalks.vehicle_wrecklessness.report' },
  { delete: 'transportation_streets_sidewalks.parking_meter.report' },
  { delete: 'transportation_streets_sidewalks.sidewalk.report' },
  { delete: 'transportation_streets_sidewalks.blocked_driveway.report' },
  { delete: 'transportation_streets_sidewalks.blocked_street.report' },
  { delete: 'transportation_streets_sidewalks.curb_cut.report' },
  { delete: 'general.community_events' },
  { delete: 'business_finance.business_vehicles.report' },
  { delete: 'business_finance.business_tattoos.report' },
  { from: 'environment_sanitation.sanitation_syringes', to: 'environment_sanitation.disposal.syringes' },
  { delete: 'property_buildings_homes.home_bed_bugs' },
  { delete: 'environment_sanitation.report_pet_cleanup' },
  // New Batch
  { from: 'voting.absentee_ballot', to: 'voting_elections_participation.absentee_ballot' },
  { from: 'voting.affiliation.change', to: 'voting_elections_participation.affiliation.change' },
  { from: 'voting.assistance', to: 'voting_elections_participation.assistance' },
  { from: 'voting.deadlines', to: 'voting_elections_participation.deadlines' },
  { from: 'voting.early', to: 'voting_elections_participation.early' },
  { from: 'voting.elections', to: 'voting_elections_participation.elections' },
  { from: 'voting.eligibility', to: 'voting_elections_participation.eligibility' },
  { from: 'voting.id', to: 'voting_elections_participation.identification' },
  { from: 'voting.polls.find', to: 'voting_elections_participation.polls.find' },
  { from: 'voting.problem', to: 'voting_elections_participation.problem' },
  { from: 'voting.registration.check', to: 'voting_elections_participation.registration.check' },
  { from: 'voting.registration.get', to: 'voting_elections_participation.registration.get' },
  { from: 'voting.sample_ballot', to: 'voting_elections_participation.sample_ballot' },
  { from: 'business_finance.advertising_billboard_requirements', to: 'business_finance.permit_license_permission.billboard.create' },
  { from: 'business_finance.advertising_door_to_door', to: 'business_finance.advertising.door_to_door' },
  { from: 'business_finance.advertising_yard_signs', to: 'business_finance.advertising.yard_signs' },
  { delete: 'business_finance.business_assistance_small_business' },
  { from: 'business_finance.business_complaint_history', to: 'business_finance.business.complaint_history' },
  { from: 'business_finance.business_contractor_poor_work', to: 'business_finance.business.report' },
  { from: 'business_finance.business_food_cart_requirements', to: 'business_finance.permit_license_permission.food_cart' },
  { from: 'business_finance.business_food_service_permit', to: 'business_finance.permit_license_permission.food_service' },
  { from: 'business_finance.business_licenses.check', to: 'business_finance.permit_license_permission.check' },
  { from: 'business_finance.business_licenses.get', to: 'business_finance.permit_license_permission.business' },
  { from: 'business_finance.business_licenses_restaurant.renew', to: 'business_finance.permit_license_permission.food_service.renew' },
  { from: 'business_finance.business_nightlife_hours', to: 'business_finance.regulation_requirements.nightlife_closing_time' },
  { from: 'business_finance.business_plastic_bag_status', to: 'business_finance.regulation_requirements.plastic_bags' },
  { delete: 'business_finance.business_requirements_restaurant' },
  { from: 'business_finance.business_restaurant_duct_requirements', to: 'business_finance.regulation_requirements.restaurant.duct_requirements' },
  { from: 'business_finance.business_signage_rules', to: 'business_finance.permit_license_permission.signs' },
  { from: 'business_finance.business_street_musician_requirements', to: 'business_finance.permit_license_permission.street_musician' },
  { from: 'business_finance.business_street_vendor_requirements', to: 'business_finance.permit_license_permission.street_vendor' },
  { delete: 'business_finance.business_tattoos.report' },
  { from: 'general.advertising_general_plastering', to: 'business_finance.advertising.general_plastering' },
  { from: 'business_finance.business_vehicles_markings', to: 'business_finance.regulation_requirements.business_vehicles_markings' },
  { from: 'business_finance.procurement_inquiry', to: 'business_finance.procurement.how_to' },
  { from: 'business_finance.procurement_vendors_approved', to: 'business_finance.procurement.approval' },
  { delete: 'business_finance.appearance' },
  { from: 'education_employment.education_college_info', to: 'education_employment.higher_education.guide' },
  { from: 'education_employment.employment_job_training', to: 'education_employment.employment.training' },
  { from: 'education_employment.employment_search', to: 'education_employment.employment.search' },
  { from: 'education_employment.public_schools.transfer_status', to: 'education_employment.public_schools.transfer.status' },
  { from: 'education_employment.schools_vacation_schedule', to: 'education_employment.public_schools.vacation.schedule' },
  { from: 'education_employment.wage_theft', to: 'education_employment.employment.wage_theft' },
  { delete: 'environment_sanitation.park.report' }, // Too vague. Youre seeing dumping, rabid animal, etc. Its just location
  { from: 'environment_sanitation.park_alcohol', to: 'environment_sanitation.park.alcohol' },
  { from: 'environment_sanitation.park_barbecue', to: 'environment_sanitation.park.barbecue' },
  { from: 'environment_sanitation.park_pets', to: 'environment_sanitation.park.pet' },
  { from: 'environment_sanitation.park_smoking', to: 'environment_sanitation.park.smoking' },
  { delete: 'environment_sanitation.sanitation_wastewater_facility.contact' }, // Satisfied by entity searching
  { from: 'environment_sanitation.environment_bear_info', to: 'environment_sanitation.bear.guide' },
  { from: 'environment_sanitation.trash.animals', to: 'environment_sanitation.trash.animal' },
  { from: 'environment_sanitation.recycling.mix', to: 'environment_sanitation.recycling.guide' },
  { from: 'general.wifi_public', to: 'general.wifi.public' },
  { from: 'government_civil_services.municipal_facility_wifi', to: 'general.wifi.municipal' },
  { from: 'general.community_facilities_membership', to: 'general.membership.public_facilities' },
  { delete: 'general.community_facilities_membership.get' },
  { from: 'general.communication_notifications.get', to: 'general.notifications' },
  { from: 'general.communication_notifications_emergencies.get', to: 'general.notifications.emergency.subscribe' },
  { from: 'general.communication_notifications_emergencies.update', to: 'general.notifications.emergency.update' },
  { from: 'government_civil_services.city_vehicle_misuse.report', to: 'government_civil_services.vehicle.misuse' },
  { from: 'government_civil_services.document_birth_certificate.get', to: 'government_civil_services.birth_certificate.request' },
  { from: 'government_civil_services.document_death_certificate.get', to: 'government_civil_services.death_certificate.request' },
  { from: 'government_civil_services.document_deed.get', to: 'government_civil_services.deed.request' },
  { from: 'government_civil_services.document_deed.submit', to: 'government_civil_services.deed.submit' },
  { from: 'government_civil_services.document_fingerprinting', to: 'government_civil_services.finger_printing' },
  { from: 'government_civil_services.document_fire_report.get', to: 'government_civil_services.fire_report.request' },
  { delete: 'government_civil_services.document_marriage_union_license.get' },
  { delete: 'government_civil_services.document_marriage_union_license.apply' },
  { from: 'government_civil_services.document_marriage_union_license.timeline', to: 'government_civil_services.marriage_civil_union_license.arrival' },
  { from: 'government_civil_services.document_pet_license', to: 'government_civil_services.pet_license' },
  { from: 'government_civil_services.document_pet_license.check', to: 'government_civil_services.pet_license.arrival' },
  { from: 'government_civil_services.identification_federal_tax_id.get', to: 'government_civil_services.identification.federal_tax_id' },
  { from: 'government_civil_services.identification_passport', to: 'government_civil_services.identification.passport' },
  { from: 'government_civil_services.identification_senior_citizen_id', to: 'government_civil_services.identification.senior_citizen_id' },
  { delete: 'government_civil_services.identification_senior_citizen_id.get' },
  { from: 'government_civil_services.law_notary_request', to: 'government_civil_services.notary' },
  { delete: 'government_civil_services.mayor_contact' },
  { from: 'government_civil_services.municipal_language_access', to: 'government_civil_services.language_access' },
  { delete: 'government_civil_services.request.failed' },
  { delete: 'government_civil_services.request.resubmit' },
  { delete: 'government_civil_services.request.status' },
  { delete: 'government_civil_services.request.submit' },
  { delete: 'government_civil_services.suggestion.submit' },
  { from: 'government_civil_services.taxes_due_date', to: 'government_civil_services.taxes.deadline' },
  { from: 'government_civil_services.taxes_payment', to: 'government_civil_services.taxes.payment' },
  { from: 'government_civil_services.taxes_senior_discount', to: 'government_civil_services.taxes.senior_discount' },
  { from: 'government_civil_services.taxes_website', to: 'government_civil_services.taxes.website' },
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
      .then((model) => {
        if (model && model[0] && model[0].id) {
          const modelId = model[0].id;
          knex.select('*').where({ question_id: modelId }).from('knowledge_question_stats').del()
            .then(d => d);
          return knex.select('*').where({ question_id: modelId }).from('knowledge_answers').del()
            .then(() => {
              return knex.select()
                .where({ label: modification.delete })
                .from('knowledge_questions')
                .del()
                .then(d => d);
            });
        }
      });
  }
});

Promise.all(updateOperations).then((results) => {
  console.log(results);
}).catch((error) => {
  console.log(error);
});
