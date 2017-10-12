// Shouts
// Meaning, comments on what we observe in our surrounding environment
// Consolidating request/complaint types from SCF cities => Washington DC, Jersey City, New Haven
// I have types in the template name when I think it could lead to different departments being involved
// When a type isn't required, it can be supplied as an extra property

// Things like permits, maybe aren't shout outs? They're directly tasks?
// How about inspections? Someone could request a tree inspection
// Actually, they're shout outs because in some cases you can't provide a permit (ex: upcoming development) meaning it will never be a task
// TBD later though

// Also we should take suggestions and vague "i need help" statments

const SO = {};
// Templates
const notes = {
  type: 'text',
  instruction: 'What else should we know?',
};
const private_property = {
  type: 'boolean',
  instruction: 'Is this located on private property?',
};
const location = {
  type: 'location',
  required: true,
  instruction: 'Where is this located?',
};
const image = {
  // required: true,
  type: 'image',
  instruction: 'Can you provide an image?',
};
const email = {
  type: 'email',
  instruction: 'What email address can send updates to?',
};
const vacant_lot = {
  type: 'boolean',
  instruction: 'Is this on a vacant lot?',
};
const public_housing = {
  type: 'boolean',
  instruction: 'Is this public housing?',
};

// Business
SO['business_finance.business'] = {};

// Environment
SO['environment_sanitation.tree'] = {
  knowledge_category: 'environment_sanitation',
  domain: 'tree',
  params: {
    location,
    attachments: image,
    notes,
  },
};
SO['environment_sanitation.tree.down'] = SO['environment_sanitation.tree'];
SO['environment_sanitation.tree.down'].params.topic = { value: 'down' };
SO['environment_sanitation.tree.inspection'] = SO['environment_sanitation.tree'];
SO['environment_sanitation.tree.inspection'].params.topic = { value: 'inspection' };
SO['environment_sanitation.tree.planting'] = SO['environment_sanitation.tree'];
SO['environment_sanitation.tree.planting'].params.topic = { value: 'planting' };
SO['environment_sanitation.tree.pruning'] = SO['environment_sanitation.tree'];
SO['environment_sanitation.tree.pruning'].params.topic = { value: 'pruning' };
SO['environment_sanitation.tree.removal'] = SO['environment_sanitation.tree'];
SO['environment_sanitation.tree.removal'].params.topic = { value: 'removal' };
SO['environment_sanitation.trash.animal'] = {};
SO['environment_sanitation.trash.collection_missed'] = {};
SO['environment_sanitation.recycling.collection_missed'] = {};
SO['environment_sanitation.litter'] = {};
SO['environment_sanitation.park.reservation'] = {};
SO['environment_sanitation.air.quality'] = {};
SO['environment_sanitation.water.flooding'] = {};
SO['environment_sanitation.water.quality'] = {};
SO['environment_sanitation.dumping'] = {
  knowledge_category: 'environment_sanitation',
  domain: 'dumping',
  params: {
    location,
    attachments: image,
    hazardous: {
      type: 'boolean',
      instruction: 'Is it hazardous?',
    },
    notes,
  },
};

// Health
SO['health_medicine.unsanitary.business'] = {};
SO['health_medicine.unsanitary.food_truck'] = {};
SO['health_medicine.unsanitary.housing'] = {};
SO['health_medicine.unsanitary.resturaunt'] = {};
SO['health_medicine.standing_water'] = {};
SO['health_medicine.animal.rabid'] = {
  knowledge_category: 'health_medicine',
  domain: 'animal',
  params: {
    location,
    topic: { value: 'rabid' },
  },
};
SO['health_medicine.animal.dead'] = {
  knowledge_category: 'health_medicine',
  domain: 'animal',
  params: {
    location,
    topic: { value: 'dead' },
  },
};
SO['health_medicine.animal.excrement'] = {
  knowledge_category: 'health_medicine',
  domain: 'animal',
  params: {
    location,
    topic: { value: 'excrement' },
  },
};
SO['health_medicine.rodents'] = {
  knowledge_category: 'health_medicine',
  domain: 'rodents',
  params: {
    location,
    private_property,
  },
};
SO['health_medicine.insects'] = {
  knowledge_category: 'health_medicine',
  domain: 'insects',
  params: {
    location,
    private_property,
  },
};
SO['health_medicine.insects.bed_bugs'] = {
  knowledge_category: 'health_medicine',
  domain: 'insects',
  params: { ...SO['health_medicine.insects'].params,
    topic: { value: 'bed_bugs' },
  },
};
SO['health_medicine.insects.bees'] = {
  knowledge_category: 'health_medicine',
  domain: 'insects',
  params: { ...SO['health_medicine.insects'].params,
    topic: { value: 'bed_bugs' },
  },
};

// Property
SO['property_buildings_homes.accessibility.ramp'] = {};
SO['property_buildings_homes.accessibility.elevator.broken'] = {};
SO['property_buildings_homes.accessibility.escalator.broken'] = {};
SO['property_buildings_homes.housing_violation'] = {
  knowledge_category: 'property_buildings_homes',
  domain: 'housing_violation',
  params: {
    location,
    email,
    notes,
  },
};
SO['property_buildings_homes.housing_violation.heat'] = SO['property_buildings_homes.housing_violation'];
SO['property_buildings_homes.housing_violation.heat'].params.topic = { value: 'heat' };
SO['property_buildings_homes.housing_violation.hot_water'] = SO['property_buildings_homes.housing_violation'];
SO['property_buildings_homes.housing_violation.hot_water'].params.topic = { value: 'hot_water' };
SO['property_buildings_homes.housing_violation.repairs'] = SO['property_buildings_homes.housing_violation'];
SO['property_buildings_homes.housing_violation.repairs'].params.topic = { value: 'repairs' };
SO['property_buildings_homes.housing_violation.repairs.housing.public'] = SO['property_buildings_homes.housing_violation.repairs'];
SO['property_buildings_homes.housing_violation.repairs.housing.public'].params.public_property = { value: true };
SO['property_buildings_homes.housing_violation.tree_damage'] = SO['property_buildings_homes.housing_violation'];
SO['property_buildings_homes.housing_violation.tree_damage'].params.topic = { value: 'tree_damage' };
SO['property_buildings_homes.housing_violation.illegal_apartments'] = SO['property_buildings_homes.housing_violation'];
SO['property_buildings_homes.housing_violation.illegal_apartments'].params.topic = { value: 'illegal_apartments' };
SO['property_buildings_homes.housing_assistance'] = {
  knowledge_category: 'property_buildings_homes',
  domain: 'housing_assistance',
  params: {
    public_housing,
    notes,
  },
};
SO['property_buildings_homes.housing_assistance.rental'] = {};
SO['property_buildings_homes.housing_assistance.section_8'] = {};
SO['property_buildings_homes.housing_assistance.emergency_housing'] = {};
SO['property_buildings_homes.housing_dispute.landlord'] = {};
SO['property_buildings_homes.housing_dispute.tenant'] = {};
SO['property_buildings_homes.housing_dispute.lease'] = {};
SO['property_buildings_homes.housing_dispute.rent_increase'] = {};
SO['property_buildings_homes.sewage.backup'] = {};
SO['property_buildings_homes.water.pressure'] = {};
SO['property_buildings_homes.water.quality'] = {};
SO['property_buildings_homes.water.leak'] = {};
SO['property_buildings_homes.water.main_break'] = {};

SO['property_buildings_homes.construction'] = {
  knowledge_category: 'property_buildings_homes',
  domain: 'construction',
  params: {
    location,
    // topic: {
    //   type: 'text',
    //   default_value: null,
    //   instruction: 'Is this a noise, permit, safety, or off hours concern?',
    //   validation: value => ['noise', 'off_hours', 'no_permit', 'safety'].includes(value),
    // },
    private_property,
    notes,
  },
};
SO['property_buildings_homes.construction.noise'] = SO['property_buildings_homes.construction'];
SO['property_buildings_homes.construction.noise'].params.topic = { value: 'noise' };
SO['property_buildings_homes.construction.off_hours'] = SO['property_buildings_homes.construction'];
SO['property_buildings_homes.construction.off_hours'].params.topic = { value: 'off_hours' };
SO['property_buildings_homes.construction.no_permit'] = SO['property_buildings_homes.construction'];
SO['property_buildings_homes.construction.no_permit'].params.topic = { value: 'no_permit' };
SO['property_buildings_homes.construction.safety'] = SO['property_buildings_homes.construction'];
SO['property_buildings_homes.construction.safety'].params.topic = { value: 'safety' };

SO['property_buildings_homes.graffiti'] = {
  knowledge_category: 'property_buildings_homes',
  domain: 'graffiti',
  params: {
    location,
    attachments: image,
    private_property,
    offensive: {
      type: 'boolean',
      instruction: 'Is it offensive?',
    },
    notes,
  },
};
SO['property_buildings_homes.over_growth'] = {
  knowledge_category: 'property_buildings_homes',
  domain: 'over_growth',
  params: {
    location,
    attachments: image,
    vacant_lot,
    notes,
  },
};
SO['property_buildings_homes.blight'] = {
  knowledge_category: 'property_buildings_homes',
  domain: 'blight',
  params: {
    location,
    attachments: image,
    vacant_lot,
    notes,
  },
};
SO['property_buildings_homes.odor'] = {
  knowledge_category: 'property_buildings_homes',
  domain: 'odor',
  params: {
    location,
    notes,
  },
};
SO['property_buildings_homes.odor.gas'] = SO['property_buildings_homes.odor'];
SO['property_buildings_homes.odor.gas'].params.topic = { value: 'gas' };
SO['property_buildings_homes.mold'] = {
  knowledge_category: 'property_buildings_homes',
  domain: 'mold',
  params: {
    location,
    attachments: image,
    notes,
  },
};
SO['property_buildings_homes.eviction'] = {};
SO['property_buildings_homes.fire_hazard'] = {};
SO['property_buildings_homes.noise'] = {
  knowledge_category: 'property_buildings_homes',
  domain: 'noise',
  params: {
    location,
    notes,
  },
};
SO['property_buildings_homes.squatting'] = {};

// Public Safety
SO['public_safety_law.harassment'] = {};
SO['public_safety_law.hate_crime'] = {};
SO['public_safety_law.missing_person'] = {};
SO['public_safety_law.panhandling'] = {};
SO['public_safety_law.activity'] = {
  knowledge_category: 'public_safety_law',
  domain: 'activity',
  params: {
    location,
    notes,
  },
};
SO['public_safety_law.activity.drug'] = SO['public_safety_law.activity'];
SO['public_safety_law.activity.drug'].params.topic = { value: 'drug' };
SO['public_safety_law.activity.suspicious'] = SO['public_safety_law.activity'];
SO['public_safety_law.activity.suspicious'].params.topic = { value: 'suspicious' };

// Transportation
SO['transportation_streets_sidewalks.street'] = {
  knowledge_category: 'transportation_streets_sidewalks',
  domain: 'street',
  params: {
    location,
    attachments: image,
    notes,
  },
};
SO['transportation_streets_sidewalks.street.pothole'] = SO['transportation_streets_sidewalks.street'];
SO['transportation_streets_sidewalks.street.pothole'].params.topic = { value: 'pothole' };
SO['transportation_streets_sidewalks.street.manhole'] = SO['transportation_streets_sidewalks.street'];
SO['transportation_streets_sidewalks.street.manhole'].params.topic = { value: 'manhole' };
SO['transportation_streets_sidewalks.street.fire_hydrant'] = SO['transportation_streets_sidewalks.street'];
SO['transportation_streets_sidewalks.street.fire_hydrant'].params.topic = { value: 'fire_hydrant' };
SO['transportation_streets_sidewalks.street.blocking'] = SO['transportation_streets_sidewalks.street'];
SO['transportation_streets_sidewalks.street.blocking'].params.topic = { value: 'blocking' };

SO['transportation_streets_sidewalks.driveway'] = {};
SO['transportation_streets_sidewalks.sidewalk'] = {};
SO['transportation_streets_sidewalks.sidewalk.broken'] = {};
SO['transportation_streets_sidewalks.curb'] = {};
SO['transportation_streets_sidewalks.curb.ramp'] = {};

SO['transportation_streets_sidewalks.sign'] = {
  knowledge_category: 'transportation_streets_sidewalks',
  domain: 'sign',
  params: {
    location,
    attachments: image,
  },
};
SO['transportation_streets_sidewalks.sign.missing'] = SO['transportation_streets_sidewalks.sign'];
SO['transportation_streets_sidewalks.sign.missing'].params.topic = { value: 'missing' };
SO['transportation_streets_sidewalks.sign.broken'] = SO['transportation_streets_sidewalks.sign'];
SO['transportation_streets_sidewalks.sign.broken'].params.topic = { value: 'broken' };
SO['transportation_streets_sidewalks.sign.conflict'] = SO['transportation_streets_sidewalks.sign'];
SO['transportation_streets_sidewalks.sign.conflict'].params.topic = { value: 'conflict' };
SO['transportation_streets_sidewalks.sign.down'] = SO['transportation_streets_sidewalks.sign'];
SO['transportation_streets_sidewalks.sign.down'].params.topic = { value: 'down' };
SO['transportation_streets_sidewalks.sign.request'] = SO['transportation_streets_sidewalks.sign'];
SO['transportation_streets_sidewalks.sign.request'].params.topic = { value: 'request' };

SO['transportation_streets_sidewalks.signal'] = {
  knowledge_category: 'transportation_streets_sidewalks',
  domain: 'signal',
  params: {
    location,
    attachments: image,
  },
};
SO['transportation_streets_sidewalks.signal.always_on'] = SO['transportation_streets_sidewalks.signal'];
SO['transportation_streets_sidewalks.signal.always_on'].params.topic = { value: 'always_on' };
SO['transportation_streets_sidewalks.signal.burnt_out'] = SO['transportation_streets_sidewalks.signal'];
SO['transportation_streets_sidewalks.signal.burnt_out'].params.topic = { value: 'burnt_out' };
SO['transportation_streets_sidewalks.signal.flickering'] = SO['transportation_streets_sidewalks.signal'];
SO['transportation_streets_sidewalks.signal.flickering'].params.topic = { value: 'flickering' };
SO['transportation_streets_sidewalks.signal.down'] = SO['transportation_streets_sidewalks.signal'];
SO['transportation_streets_sidewalks.signal.down'].params.topic = { value: 'down' };
SO['transportation_streets_sidewalks.signal.request'] = SO['transportation_streets_sidewalks.signal'];
SO['transportation_streets_sidewalks.signal.request'].params.topic = { value: 'request' };

SO['transportation_streets_sidewalks.street_light'] = {
  knowledge_category: 'transportation_streets_sidewalks',
  domain: 'street_light',
  params: {
    location,
    attachments: image,
  },
};
SO['transportation_streets_sidewalks.street_light.always_on'] = SO['transportation_streets_sidewalks.street_light'];
SO['transportation_streets_sidewalks.street_light.always_on'].params.topic = { value: 'always_on' };
SO['transportation_streets_sidewalks.street_light.burnt_out'] = SO['transportation_streets_sidewalks.street_light'];
SO['transportation_streets_sidewalks.street_light.burnt_out'].params.topic = { value: 'burnt_out' };
SO['transportation_streets_sidewalks.street_light.flickering'] = SO['transportation_streets_sidewalks.street_light'];
SO['transportation_streets_sidewalks.street_light.flickering'].params.topic = { value: 'flickering' };
SO['transportation_streets_sidewalks.street_light.down'] = SO['transportation_streets_sidewalks.street_light'];
SO['transportation_streets_sidewalks.street_light.down'].params.topic = { value: 'down' };
SO['transportation_streets_sidewalks.street_light.request'] = SO['transportation_streets_sidewalks.street_light'];
SO['transportation_streets_sidewalks.street_light.request'].params.topic = { value: 'request' };

SO['transportation_streets_sidewalks.parking_violation'] = {
  knowledge_category: 'transportation_streets_sidewalks',
  domain: 'parking',
  params: {
    location,
    attachments: image,
  },
};
SO['transportation_streets_sidewalks.parking_violation.blocking'] = SO['transportation_streets_sidewalks.parking_violation'];
SO['transportation_streets_sidewalks.parking_violation.blocking'].params.topic = { value: 'blocking' };
SO['transportation_streets_sidewalks.parking_violation.bus_zone'] = SO['transportation_streets_sidewalks.parking_violation'];
SO['transportation_streets_sidewalks.parking_violation.bus_zone'].params.topic = { value: 'bus_zone' };
SO['transportation_streets_sidewalks.parking_violation.no_parking'] = SO['transportation_streets_sidewalks.parking_violation'];
SO['transportation_streets_sidewalks.parking_violation.no_parking'].params.topic = { value: 'no_parking' };
SO['transportation_streets_sidewalks.parking_violation.emergency_zone'] = SO['transportation_streets_sidewalks.parking_violation'];
SO['transportation_streets_sidewalks.parking_violation.emergency_zone'].params.topic = { value: 'emergency_zone' };
SO['transportation_streets_sidewalks.parking_violation.expired_tags'] = SO['transportation_streets_sidewalks.parking_violation'];
SO['transportation_streets_sidewalks.parking_violation.expired_tags'].params.topic = { value: 'expired_tags' };
SO['transportation_streets_sidewalks.parking_violation.fire_hydrant'] = SO['transportation_streets_sidewalks.parking_violation'];
SO['transportation_streets_sidewalks.parking_violation.fire_hydrant'].params.topic = { value: 'fire_hydrant' };
SO['transportation_streets_sidewalks.parking_violation.handicap'] = SO['transportation_streets_sidewalks.parking_violation'];
SO['transportation_streets_sidewalks.parking_violation.handicap'].params.topic = { value: 'handicap' };
SO['transportation_streets_sidewalks.parking_violation.loading_zone'] = SO['transportation_streets_sidewalks.parking_violation'];
SO['transportation_streets_sidewalks.parking_violation.loading_zone'].params.topic = { value: 'loading_zone' };
SO['transportation_streets_sidewalks.parking_violation.meter'] = SO['transportation_streets_sidewalks.parking_violation'];
SO['transportation_streets_sidewalks.parking_violation.meter'].params.topic = { value: 'meter' };
SO['transportation_streets_sidewalks.parking_violation.school_zone'] = SO['transportation_streets_sidewalks.parking_violation'];
SO['transportation_streets_sidewalks.parking_violation.school_zone'].params.topic = { value: 'school_zone' };

SO['transportation_streets_sidewalks.parking_meter'] = {};
SO['transportation_streets_sidewalks.parking_meter.broken'] = {};

SO['transportation_streets_sidewalks.construction.noise'] = {
  knowledge_category: 'transportation_streets_sidewalks',
  domain: 'construction',
  params: {
    location,
    topic: { value: 'noise' },
  },
};

SO['transportation_streets_sidewalks.bicycle.racks'] = {};
SO['transportation_streets_sidewalks.bicycle.lanes'] = {};
SO['transportation_streets_sidewalks.bicycle.sharing'] = {};
SO['transportation_streets_sidewalks.bicycle.abandoned'] = {
  params: {
    private_property,
  },
};
SO['transportation_streets_sidewalks.vehicle.idling'] = {
  knowledge_category: 'transportation_streets_sidewalks',
  domain: 'vehicle',
  params: {
    location,
    attachments: image,
    topic: { value: 'idling' },
  },
};
SO['transportation_streets_sidewalks.vehicle.wreckless'] = {};
SO['transportation_streets_sidewalks.vehicle.abandoned'] = {};
SO['transportation_streets_sidewalks.wire.down'] = {};
SO['transportation_streets_sidewalks.wire.safety'] = {};

// Government, Civil Services
SO['government_civil_services.vehicle.misuse'] = {};

// Social Services
SO['government_civil_services.vehicle.misuse'] = {};


// Compile!
const readySO = {};
Object.keys(SO).forEach((key) => {
  if (Object.keys(SO[key]).length > 0) {
    readySO[key] = SO[key];
  }
});
module.exports = {
  all: SO,
  ready: readySO,
};
