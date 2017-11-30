// Setup
require('babel-core/register');
require('babel-polyfill');
require('../api/env').setup();
const knex = require('../api/orm').knex;

const updateOperations = [
  // New Batch
  // { from: 'voting.absentee_ballot', to: 'voting_elections_participation.absentee_ballot' },
  // { from: 'voting.affiliation.change', to: 'voting_elections_participation.affiliation.change' },
  // { from: 'voting.assistance', to: 'voting_elections_participation.assistance' },
  // { from: 'voting.deadlines', to: 'voting_elections_participation.deadlines' },
  // { from: 'voting.early', to: 'voting_elections_participation.early' },
  // { from: 'voting.elections', to: 'voting_elections_participation.elections' },
  // { from: 'voting.eligibility', to: 'voting_elections_participation.eligibility' },
  // { from: 'voting.id', to: 'voting_elections_participation.identification' },
  // { from: 'voting.polls.find', to: 'voting_elections_participation.polls.find' },
  // { from: 'voting.problem', to: 'voting_elections_participation.problem' },
  // { from: 'voting.registration.check', to: 'voting_elections_participation.registration.check' },
  // { from: 'voting.registration.get', to: 'voting_elections_participation.registration.request' },
  // { from: 'voting.sample_ballot', to: 'voting_elections_participation.sample_ballot' },
  // { from: 'business_finance.advertising_billboard_requirements', to: 'business_finance.permit_license_permission.billboard.create' },
  // { from: 'business_finance.advertising_door_to_door', to: 'business_finance.advertising.door_to_door' },
  // { from: 'business_finance.advertising_yard_signs', to: 'business_finance.advertising.yard_signs' },
  // { delete: 'business_finance.business_assistance_small_business' },
  // { from: 'business_finance.business_complaint_history', to: 'business_finance.history_records.complaint.business' },
  // { from: 'business_finance.business_contractor_poor_work', to: 'business_finance.business.report' },
  // { from: 'business_finance.business_food_cart_requirements', to: 'business_finance.permit_license_permission.food_cart' },
  // { from: 'business_finance.business_food_service_permit', to: 'business_finance.permit_license_permission.food_service' },
  // { from: 'business_finance.business_licenses.get', to: 'business_finance.permit_license_permission.business' },
  // { from: 'business_finance.business_licenses.check', to: 'business_finance.permit_license_permission.business.check' },
  // { from: 'business_finance.business_licenses_restaurant.renew', to: 'business_finance.permit_license_permission.food_service.renew' },
  // { from: 'business_finance.business_nightlife_hours', to: 'business_finance.regulation_requirements.nightlife_closing_time' },
  // { from: 'business_finance.business_plastic_bag_status', to: 'business_finance.regulation_requirements.plastic_bags' },
  // { delete: 'business_finance.business_requirements_restaurant' },
  // { from: 'business_finance.business_restaurant_duct_requirements', to: 'business_finance.regulation_requirements.restaurant.duct_requirements' },
  // { from: 'business_finance.business_signage_rules', to: 'business_finance.permit_license_permission.signs' },
  // { from: 'business_finance.business_street_musician_requirements', to: 'business_finance.permit_license_permission.street_musician' },
  // { from: 'business_finance.business_street_vendor_requirements', to: 'business_finance.permit_license_permission.street_vendor' },
  // { delete: 'business_finance.business_tattoos.report' },
  // { from: 'general.advertising_general_plastering', to: 'business_finance.advertising.general_plastering' },
  // { from: 'business_finance.business_vehicles_markings', to: 'business_finance.regulation_requirements.business.vehicle.markings' },
  // { from: 'business_finance.procurement_inquiry', to: 'business_finance.procurement.guide' },
  // { from: 'business_finance.procurement_vendors_approved', to: 'business_finance.procurement.approved' },
  // { delete: 'business_finance.appearance' },
  // { from: 'education_employment.education_college_info', to: 'education_employment.higher_education.guide' },
  // { from: 'education_employment.employment_job_training', to: 'education_employment.employment.training' },
  // { from: 'education_employment.employment_search', to: 'education_employment.employment.search' },
  // { from: 'education_employment.public_schools.transfer_status', to: 'education_employment.public_schools.transfer.status' },
  // { from: 'education_employment.schools_vacation_schedule', to: 'education_employment.public_schools.vacation.schedule' },
  // { from: 'education_employment.wage_theft', to: 'education_employment.employment.wage_theft' },
  // { delete: 'environment_sanitation.park.report' }, // Too vague. Youre seeing dumping, rabid animal, etc. Its just location
  // { from: 'environment_sanitation.park_alcohol', to: 'environment_sanitation.park.alcohol' },
  // { from: 'environment_sanitation.park_barbecue', to: 'environment_sanitation.park.barbecue' },
  // { from: 'environment_sanitation.park_pets', to: 'environment_sanitation.park.pet' },
  // { from: 'environment_sanitation.park_smoking', to: 'environment_sanitation.park.smoking' },
  // { delete: 'environment_sanitation.sanitation_wastewater_facility.contact' }, // Satisfied by entity searching
  // { from: 'environment_sanitation.environment_bear_info', to: 'environment_sanitation.bear.guide' },
  // { from: 'environment_sanitation.trash.animals', to: 'environment_sanitation.trash.animal' },
  // { from: 'environment_sanitation.recycling.mix', to: 'environment_sanitation.recycling.guide' },
  // { from: 'general.wifi_public', to: 'general.wifi.public' },
  // { from: 'government_civil_services.municipal_facility_wifi', to: 'general.wifi.municipal' },
  // { from: 'general.community_facilities_membership', to: 'general.join.public_facilities' },
  // { delete: 'general.community_facilities_membership.get' },
  // { from: 'general.communication_notifications.get', to: 'general.notifications' },
  // { delete: 'general.notifications' },
  // { from: 'general.communication_notifications_emergencies.get', to: 'general.notifications.emergency.subscribe' },
  // { delete: 'general.notifications.emergency.subscribe' },
  // { from: 'general.communication_notifications_emergencies.update', to: 'general.notifications.emergency.update' },
  // { delete: 'general.notifications.emergency.update' },
  // { from: 'government_civil_services.city_vehicle_misuse.report', to: 'government_civil_services.vehicle.misuse' },
  // { from: 'government_civil_services.document_birth_certificate.get', to: 'government_civil_services.birth_certificate.request' },
  // { from: 'government_civil_services.document_death_certificate.get', to: 'government_civil_services.death_certificate.request' },
  // { from: 'government_civil_services.document_deed.get', to: 'government_civil_services.deed.request' },
  // { from: 'government_civil_services.document_deed.submit', to: 'government_civil_services.deed.submit' },
  // { from: 'government_civil_services.document_fingerprinting', to: 'government_civil_services.finger_printing' },
  // { from: 'government_civil_services.document_fire_report.get', to: 'government_civil_services.fire_report.request' },
  // { delete: 'government_civil_services.document_marriage_union_license.get' },
  // { delete: 'government_civil_services.document_marriage_union_license.apply' },
  // { from: 'government_civil_services.document_marriage_union_license.timeline', to: 'government_civil_services.marriage_civil_union_license.arrival' },
  // { from: 'government_civil_services.document_pet_license', to: 'government_civil_services.pet_license' },
  // { from: 'government_civil_services.document_pet_license.check', to: 'government_civil_services.pet_license.arrival' },
  // { from: 'government_civil_services.identification_federal_tax_id.get', to: 'government_civil_services.identification.federal_tax_id' },
  // { from: 'government_civil_services.identification_passport', to: 'government_civil_services.identification.passport' },
  // { from: 'government_civil_services.identification_senior_citizen_id', to: 'government_civil_services.identification.senior_citizen_id' },
  // { delete: 'government_civil_services.identification_senior_citizen_id.get' },
  // { from: 'government_civil_services.law_notary_request', to: 'government_civil_services.notary' },
  // { delete: 'government_civil_services.mayor_contact' },
  // { from: 'government_civil_services.municipal_language_access', to: 'government_civil_services.language_access' },
  // { delete: 'government_civil_services.request.failed' },
  // { delete: 'government_civil_services.request.resubmit' },
  // { delete: 'government_civil_services.request.status' },
  // { delete: 'government_civil_services.request.submit' },
  // { delete: 'government_civil_services.suggestion.submit' },
  // { from: 'government_civil_services.taxes_due_date', to: 'government_civil_services.taxes.deadlines' },
  // { from: 'government_civil_services.taxes_payment', to: 'government_civil_services.payment.taxes' },
  // { from: 'government_civil_services.taxes_senior_discount', to: 'government_civil_services.taxes.senior_discount' },
  // { from: 'government_civil_services.taxes_website', to: 'government_civil_services.taxes.website' },
  // { from: 'health_medicine.animal_bat_contact', to: 'health_medicine.animal.bat.touched' },
  // { from: 'health_medicine.animal_bat_trapped', to: 'health_medicine.animal.bat.trapped' },
  // { from: 'health_medicine.animal_rabbies_found', to: 'health_medicine.animal.rabbies.guide' },
  // { from: 'health_medicine.animal_rabbies_signs', to: 'health_medicine.animal.rabbies' },
  // { from: 'health_medicine.health_guides', to: 'health_medicine.healthy_living.guide' },
  // { from: 'health_medicine.health_std_testing', to: 'health_medicine.std.screening' },
  // { delete: 'health_medicine.screening.std' },
  // { from: 'health_medicine.health_tb_testing', to: 'health_medicine.tb.screening' },
  // { delete: 'health_medicine.screening.tb' },
  // { from: 'health_medicine.mosquito_spraying_schedule', to: 'health_medicine.mosquito.spraying.schedule' },
  // { from: 'health_medicine.payments_ambulance_inquiry', to: 'health_medicine.ambulance.payment' },
  // { from: 'health_medicine.vacination_children', to: 'health_medicine.vaccination.child' },
  // { from: 'property_buildings_homes.document_building_plans.get', to: 'property_buildings_homes.building_plans.request' },
  // { from: 'property_buildings_homes.document_hqs_report.get', to: 'property_buildings_homes.housing_quality_standards_report.request' },
  // { from: 'property_buildings_homes.fire_hazard.report', to: 'property_buildings_homes.fire_hazard' },
  // { from: 'property_buildings_homes.home_bed_bugs_responsibility', to: 'property_buildings_homes.responsibility.bed_bugs' },
  // { from: 'property_buildings_homes.home_deck_modification', to: 'property_buildings_homes.modification.deck' },
  // { from: 'property_buildings_homes.home_driveway_modification', to: 'property_buildings_homes.modification.driveway' },
  // { from: 'property_buildings_homes.home_fences', to: 'property_buildings_homes.fences' },
  // { from: 'property_buildings_homes.home_fences_property_line', to: 'property_buildings_homes.fences.property_line' },
  // { from: 'property_buildings_homes.home_furnace_problem_responsibility', to: 'property_buildings_homes.responsibility.furnace' },
  // { from: 'property_buildings_homes.home_landscaping_permit', to: 'property_buildings_homes.permit_license_permission.landscaping' },
  // { from: 'property_buildings_homes.home_lighting', to: 'property_buildings_homes.lighting' },
  // { from: 'property_buildings_homes.home_lighting_outdoor', to: 'property_buildings_homes.lighting.outdoor' },
  // { from: 'property_buildings_homes.home_max_occupancy', to: 'property_buildings_homes.regulation_requirements.max_occupancy.home' },
  // { from: 'property_buildings_homes.home_propane', to: 'property_buildings_homes.permit_license_permission.propane' },
  // { from: 'property_buildings_homes.home_room_rental', to: 'property_buildings_homes.regulation_requirements.rental' },
  // { from: 'property_buildings_homes.home_selling_requirements', to: 'property_buildings_homes.regulation_requirements.home.selling' },
  // { from: 'property_buildings_homes.home_water_hardness', to: 'property_buildings_homes.water_hardness' },
  // { from: 'property_buildings_homes.home_smoking', to: 'property_buildings_homes.regulation_requirements.smoking.housing' },
  // { from: 'property_buildings_homes.inspection.request', to: 'property_buildings_homes.inspection.building.request' },
  // { from: 'property_buildings_homes.planning_master_plan', to: 'property_buildings_homes.master_plan' },
  // { from: 'property_buildings_homes.property_air_quality_check', to: 'property_buildings_homes.air.quality' },
  // { from: 'property_buildings_homes.property_backflow_preventer_registration', to: 'property_buildings_homes.registration.backflow_preventer.check' },
  // { from: 'property_buildings_homes.property_boiler_register', to: 'property_buildings_homes.registration.boiler' },
  // { delete: 'property_buildings_homes.property_change_use' },
  // { delete: 'property_buildings_homes.change_use' },
  // { delete: 'property_buildings_homes.graffiti.report' },
  // { from: 'property_buildings_homes.property_demolition_requirements', to: 'property_buildings_homes.permit_license_permission.demolition' },
  // { from: 'property_buildings_homes.property_distressed_animal', to: 'property_buildings_homes.animal.distressed' },
  // { from: 'property_buildings_homes.property_district.check', to: 'property_buildings_homes.district' },
  // { from: 'property_buildings_homes.property_drainage', to: 'property_buildings_homes.drainage' },
  // { from: 'property_buildings_homes.property_dumpster', to: 'property_buildings_homes.permit_license_permission.dumpster' },
  // { from: 'property_buildings_homes.property_equipment_use', to: 'property_buildings_homes.permit_license_permission.equipment_use' },
  // { from: 'property_buildings_homes.property_fire_inspection', to: 'property_buildings_homes.inspection.fire' },
  // { from: 'property_buildings_homes.property_fire_inspection.cancel', to: 'property_buildings_homes.inspection.cancel.fire' },
  // { from: 'property_buildings_homes.property_fire_inspection.request', to: 'property_buildings_homes.inspection.request.fire' },
  // { from: 'property_buildings_homes.property_flood_zone', to: 'property_buildings_homes.district_zoning.flood' },
  // { from: 'environment_sanitation.water.flooding', to: 'environment_sanitation.water.flood' },
  // { delete: 'property_buildings_homes.property_flood_zone.check' },
  // { from: 'property_buildings_homes.property_historical_district.check', to: 'property_buildings_homes.district_zoning.historical' },
  // { from: 'property_buildings_homes.property_infestation_history', to: 'property_buildings_homes.history_records.infestation' },
  // { from: 'property_buildings_homes.property_landlord_complaint', to: 'property_buildings_homes.history_records.complaint.landlord' },
  // { from: 'property_buildings_homes.property_landlord_requirements_ac', to: 'property_buildings_homes.responsibility.air_conditioning' },
  // { from: 'property_buildings_homes.property_landlord_requirements_heating', to: 'property_buildings_homes.responsibility.heat' },
  // { from: 'property_buildings_homes.property_livestock', to: 'property_buildings_homes.livestock' },
  // { from: 'property_buildings_homes.property_oil_tank_records', to: 'property_buildings_homes.oil_tanks.history_records' },
  // { from: 'property_buildings_homes.property_lots_merge', to: 'property_buildings_homes.lot_merge' },
  // { from: 'property_buildings_homes.property_oil_tank_replacement', to: 'property_buildings_homes.oil_tanks.replacement' },
  // { from: 'property_buildings_homes.property_permit_signing_contact', to: 'property_buildings_homes.permit_license_permission.sign_off.building' },
  // { from: 'property_buildings_homes.property_railings_requirements', to: 'property_buildings_homes.regulation_requirements.railings' },
  // { from: 'property_buildings_homes.property_sewer_connection', to: 'property_buildings_homes.sewer_connection' },
  // { from: 'property_buildings_homes.property_sewer_connection_reimbursement', to: 'property_buildings_homes.sewer_connection.reimbursement' },
  // { from: 'property_buildings_homes.property_shed_permit', to: 'property_buildings_homes.permit_license_permission.shed' },
  // { from: 'property_buildings_homes.property_smoking_public', to: 'property_buildings_homes.regulation_requirements.smoking.public_space' },
  // { from: 'property_buildings_homes.property_sprinkler_requirements', to: 'property_buildings_homes.regulation_requirements.sprinkler' },
  // { from: 'property_buildings_homes.property_surrounding_owners.get', to: 'property_buildings_homes.property.search' },
  // { from: 'property_buildings_homes.property_tenant_history', to: 'property_buildings_homes.history_records.complaint.tenant' },
  // { delete: 'property_buildings_homes.property_tree_planting' },
  // { from: 'property_buildings_homes.property_tree_overhang', to: 'property_buildings_homes.regulation_requirements.tree.overhang' },
  // { from: 'property_buildings_homes.property_tree_public_private', to: 'property_buildings_homes.map.tree' }, // Update sentence: How do I know whos responsible for a tree?
  // { from: 'property_buildings_homes.property_water_supplier', to: 'property_buildings_homes.water_supplier' },
  // { from: 'property_buildings_homes.property_zoning.check', to: 'property_buildings_homes.district_zoning.search' },
  // { from: 'property_buildings_homes.public_housing_maintenance.report', to: 'property_buildings_homes.violation.housing.repairs.public' }, // Created a shout for this
  // { from: 'public_safety_law.corrections_holding.search', to: 'public_safety_law.corrections.holdings.search' },
  // { from: 'public_safety_law.emergencies_shelter', to: 'public_safety_law.emergency.shelter' },
  // { from: 'public_safety_law.event_requirements', to: 'public_safety_law.event' },
  // { from: 'public_safety_law.firearms_purchasing_requirements', to: 'public_safety_law.regulation_requirements.firearm' },
  // { from: 'public_safety_law.harassment.report', to: 'public_safety_law.harassment' },
  // { from: 'public_safety_law.hate_crime.report', to: 'public_safety_law.hate_crime' },
  // { from: 'public_safety_law.identity_theft.report', to: 'public_safety_law.identity_theft' },
  // { from: 'public_safety_law.law_court_date', to: 'public_safety_law.court.date' },
  // { from: 'public_safety_law.law_court_documents', to: 'public_safety_law.court.guide' },
  // { from: 'public_safety_law.law_court_plea_early', to: 'public_safety_law.court.plea' },
  // { from: 'public_safety_law.law_restraining_order', to: 'public_safety_law.restraining_order' },
  // { from: 'public_safety_law.missing_person.report', to: 'public_safety_law.missing_person' },
  // { from: 'public_safety_law.panhandling.report', to: 'public_safety_law.panhandling' },
  // { from: 'public_safety_law.property_reclaiming', to: 'public_safety_law.corrections.belongings' },
  // { from: 'public_safety_law.public_assembly_requirements', to: 'public_safety_law.regulation_requirements.public_assembly' },
  // { from: 'public_safety_law.public_safety_crime.report', to: 'public_safety_law.crime' },
  // { from: 'public_safety_law.public_safety_crime_followup', to: 'public_safety_law.crime.status' },
  // { from: 'public_safety_law.public_safety_crime_report', to: 'public_safety_law.police_report.request' },
  // { from: 'public_safety_law.public_safety_drug_activity.report', to: 'public_safety_law.activity.drug' },
  // { from: 'public_safety_law.suspicious_activity.report', to: 'public_safety_law.activity.suspicious' },
  // { from: 'public_safety_law.terror_response', to: 'public_safety_law.emergency.terrorism' },
  // { delete: 'public_safety_law.wire_danger.report' },
  // { from: 'transportation_streets_sidewalks.utility.wire_danger', to: 'transportation_streets_sidewalks.wire' },
  // { delete: 'transportation_streets_sidewalks.wire' },
  // { from: 'public_safety_law.tree_down.report', to: 'environment_sanitation.tree.down' },
  // { from: 'social_services.abuse_child', to: 'social_services.abuse.child' },
  // { from: 'social_services.abuse_relationship', to: 'social_services.abuse.relationship' },
  // { from: 'social_services.child_care_payments', to: 'social_services.child_care.payment' },
  // { from: 'social_services.credit_assistance', to: 'social_services.assistance.credit' },
  // { from: 'social_services.debt_assistance', to: 'social_services.assistance.debt' },
  // { from: 'social_services.drug_use', to: 'social_services.assistance.drug' },
  // { from: 'social_services.drug_use_child', to: 'social_services.assistance.drug.child' },
  // { from: 'social_services.food_assistance', to: 'social_services.assistance.food' },
  // { from: 'social_services.funeral_assistance', to: 'social_services.assistance.funeral' },
  // { from: 'social_services.public_assistance', to: 'social_services.assistance' },
  // { from: 'social_services.rent_assistance', to: 'social_services.assistance.rent' },
  // { from: 'social_services.shelters', to: 'social_services.shelter' },
  // { from: 'social_services.speech_therapy_children', to: 'social_services.speech_therapy.child' },
  // { delete: 'transportation_streets_sidewalks.event_block_party' },
  // { delete: 'transportation_streets_sidewalks.event_block_party.check' },
  // { from: 'transportation_streets_sidewalks.map.street_signs', to: 'transportation_streets_sidewalks.map.signs' },
  // { from: 'transportation_streets_sidewalks.parking.asp_map', to: 'transportation_streets_sidewalks.map.asp' },
  // { from: 'transportation_streets_sidewalks.parking.asp_schedule', to: 'transportation_streets_sidewalks.parking.asp.schedule' },
  // { from: 'transportation_streets_sidewalks.parking.asp_sweeper', to: 'transportation_streets_sidewalks.parking.asp.duration' },
  // { from: 'transportation_streets_sidewalks.parking.asp_weekends', to: 'transportation_streets_sidewalks.parking.asp.weekends' },
  // { from: 'transportation_streets_sidewalks.parking.asp_double', to: 'transportation_streets_sidewalks.parking.asp.double' },
  // { from: 'transportation_streets_sidewalks.parking.asp_info', to: 'transportation_streets_sidewalks.parking.asp.guide' },
  // { from: 'transportation_streets_sidewalks.map.parking_meters', to: 'transportation_streets_sidewalks.map.parking_meter' },
  // { from: 'transportation_streets_sidewalks.parking.disability_permit', to: 'transportation_streets_sidewalks.parking.permit_license_permission.disability_parking' },
  // { from: 'transportation_streets_sidewalks.parking.residential_permit_numbers', to: 'transportation_streets_sidewalks.parking.permit_license_permission.residential_parking' },
  // { from: 'transportation_streets_sidewalks.plow_schedule', to: 'transportation_streets_sidewalks.plowing.schedule' },
  // { from: 'transportation_streets_sidewalks.road_work.check', to: 'transportation_streets_sidewalks.road_work' },
  // { from: 'transportation_streets_sidewalks.road_work_blocking', to: 'transportation_streets_sidewalks.road_work.accessibility' },
  // { from: 'transportation_streets_sidewalks.road_work_updates', to: 'transportation_streets_sidewalks.road_work.status' },
  // { from: 'transportation_streets_sidewalks.taxi_lost_item', to: 'transportation_streets_sidewalks.taxi.belongings' },
  // { from: 'transportation_streets_sidewalks.taxi_passenger_limit', to: 'transportation_streets_sidewalks.taxi.max_occupancy' },
  // { from: 'transportation_streets_sidewalks.ticket_traffic_contest', to: 'transportation_streets_sidewalks.ticket.traffic.contested' },
  // { from: 'transportation_streets_sidewalks.ticket_traffic_contest_timeline', to: 'transportation_streets_sidewalks.ticket.traffic.contested.arrival' },
  // { from: 'transportation_streets_sidewalks.ticket_traffic_lost', to: 'transportation_streets_sidewalks.ticket.traffic.lost' },
  // { from: 'transportation_streets_sidewalks.ticket_traffic_payment', to: 'transportation_streets_sidewalks.ticket.traffic.payment' },
  // { from: 'transportation_streets_sidewalks.vehicle_accident', to: 'transportation_streets_sidewalks.vehicle.accident' },
  // { from: 'transportation_streets_sidewalks.vehicle_accident_witness', to: 'transportation_streets_sidewalks.vehicle.witness' },
  // { from: 'transportation_streets_sidewalks.vehicle_towed.search', to: 'transportation_streets_sidewalks.vehicle.towed' },
  // { from: 'interaction.tasks.get', to: 'interaction.tasks.status' },
  // { delete: 'interaction.tasks.create' },
  // { delete: 'interaction.tasks' },
  // { from: 'voting_elections_participation.polls.find', to: 'voting_elections_participation.polls.search' },
  // { from: 'transportation_streets_sidewalks.street.blocked', to: 'transportation_streets_sidewalks.street.blocking' },
  // { from: 'voting_elections_participation.problem', to: 'voting_elections_participation.blocking' },
  // { from: 'voting_elections_participation.affiliation.change', to: 'voting_elections_participation.affiliation.update' },
  // { from: 'settings.locality.change', to: 'settings.locality.update' },
  // { from: 'property_buildings_homes.accessibility.broken_elevator', to: 'property_buildings_homes.accessibility.elevator.broken' },
  // { from: 'property_buildings_homes.accessibility.broken_escalator', to: 'property_buildings_homes.accessibility.escalator.broken' },
  // { from: 'health_medicine.unsanitary.resturaunt', to: 'health_medicine.unsanitary.restaurant' },
  // { from: 'transportation_streets_sidewalks.vehicle.wreckless', to: 'transportation_streets_sidewalks.vehicle.reckless' },
  // { delete: 'health_medicine.animal.rabid' },
  // { from: 'social_services.human_traffiking', to: 'social_services.human_trafficking' },
  // { delete: 'environment_sanitation.disposal.bulk_pickup' },
  // { from: 'property_buildings_homes.housing_violation.heat', to: 'property_buildings_homes.violation.housing.heat' },
  // { from: 'property_buildings_homes.housing_violation.hot_water', to: 'property_buildings_homes.violation.housing.hot_water' },
  // { from: 'property_buildings_homes.housing_violation.repairs', to: 'property_buildings_homes.violation.housing.repairs' },
  // { from: 'property_buildings_homes.housing_violation.repairs.public', to: 'property_buildings_homes.violation.housing.repairs.public' },
  // { from: 'property_buildings_homes.housing_violation.tree_damage', to: 'property_buildings_homes.violation.housing.tree_damage' },
  // { from: 'property_buildings_homes.housing_violation.illegal_apartments', to: 'property_buildings_homes.violation.housing.illegal_apartments' },
  // { delete: 'property_buildings_homes.housing_assistance' },
  // { delete: 'property_buildings_homes.housing_assistance.rental' },
  // { delete: 'property_buildings_homes.housing_assistance.section_8' },
  // { delete: 'property_buildings_homes.housing_assistance.emergency_housing' },
  // { from: 'property_buildings_homes.housing_dispute.landlord', to: 'property_buildings_homes.contested.housing.landlord' },
  // { from: 'property_buildings_homes.housing_dispute.tenant', to: 'property_buildings_homes.contested.housing.tenant' },
  // { from: 'property_buildings_homes.housing_dispute.lease', to: 'property_buildings_homes.contested.housing.lease' },
  // { from: 'property_buildings_homes.housing_dispute.rent_increase', to: 'property_buildings_homes.contested.housing.rent_increase' },
  // { from: 'government_civil_services.mayor.agenda', to: 'government_civil_services.agenda' },
  // { from: 'government_civil_services.language_access', to: 'government_civil_services.language.accessibility' },
  // { from: 'transportation_streets_sidewalks.parking_violation', to: 'transportation_streets_sidewalks.violation.parking' },
  // { from: 'transportation_streets_sidewalks.parking_violation.blocking', to: 'transportation_streets_sidewalks.violation.parking.blocking' },
  // { from: 'transportation_streets_sidewalks.parking_violation.bus_zone', to: 'transportation_streets_sidewalks.violation.parking.bus_zone' },
  // { from: 'transportation_streets_sidewalks.parking_violation.no_parking', to: 'transportation_streets_sidewalks.violation.parking.no_parking' },
  // { from: 'transportation_streets_sidewalks.parking_violation.emergency_zone', to: 'transportation_streets_sidewalks.violation.parking.emergency_zone' },
  // { from: 'transportation_streets_sidewalks.parking_violation.expired_tags', to: 'transportation_streets_sidewalks.violation.parking.expired_tags' },
  // { from: 'transportation_streets_sidewalks.parking_violation.fire_hydrant', to: 'transportation_streets_sidewalks.violation.parking.fire_hydrant' },
  // { from: 'transportation_streets_sidewalks.parking_violation.handicap', to: 'transportation_streets_sidewalks.violation.parking.handicap' },
  // { from: 'transportation_streets_sidewalks.parking_violation.loading_zone', to: 'transportation_streets_sidewalks.violation.parking.loading_zone' },
  // { from: 'transportation_streets_sidewalks.parking_violation.parking_meter', to: 'transportation_streets_sidewalks.violation.parking.parking_meter' },
  // { from: 'transportation_streets_sidewalks.parking_violation.school_zone', to: 'transportation_streets_sidewalks.violation.parking.school_zone' },
  // { delete: 'property_buildings_homes.contested.housing.rent_increase' },
  // { delete: 'business_finance.business_tax_record_updating' },
  // { delete: 'government_civil_services.council.contact' },
  // { delete: 'government_civil_services.identification_federal_tax_id' },
  // { delete: 'transportation_streets_sidewalks.parking.residential_permit_request' },
  // { delete: 'transportation_streets_sidewalks.parking_violation.meter' },
  // { from: 'business_finance.procurement.how_to', to: 'business_finance.procurement.guide' },
  // { delete: 'property_buildings_homes.district' },
  // { from: 'transportation_streets_sidewalks.plowing.schedule', to: 'transportation_streets_sidewalks.snow.plowing' },
  // { delete: 'transportation_streets_sidewalks.plowing' },
  { from: 'transportation_streets_sidewalks.adopt_a_highway', to: 'transportation_streets_sidewalks.highway.adopt' },
].map((modification) => {
  // Simply update the label
  if (modification.from && modification.to) {
    return knex('knowledge_questions')
      .where({ label: modification.from })
      .update({ label: modification.to, updated_at: knex.raw('now()') })
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
