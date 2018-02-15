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

// Templates
const notes = {
  type: 'text',
  instruction: 'What else should we know? More description helps.',
};
const private_property = {
  type: 'boolean',
  instruction: "Is what you're talking about on private property?",
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
const name = {
  type: 'text',
  instruction: 'What is your name?',
}
const vacant_lot = {
  type: 'boolean',
  instruction: 'Is this on a vacant lot?',
};
const public_housing = {
  type: 'boolean',
  instruction: 'Is this public housing?',
};
const hazardous = {
  type: 'boolean',
  instruction: 'Is it hazardous?',
};
const offensive = {
  type: 'boolean',
  instruction: 'Is it offensive?',
};
const basicReport = {
  location,
  attachments: image,
};
const basicNote = {
  location,
};
const locationReport = {
  location,
  private_property,
};
const followUpReport = {
  email,
  location,
  private_property,
  attachments: image,
};

// Schema
export const ShoutOutSchema = {
  email: 'Email',
  phone: 'Phone Number',
  name: 'Name',
  location: 'Location',
  private_property: 'Public/Private Property',
  attachments: 'Attachments',
  notes: 'Notes',
  offensive: 'Offensive',
  hazardous: 'Hazardous',
};


// Shout Out Templates
const SO = {};

// Business
SO['business_finance.business'] = {};

// Environment
SO['environment_sanitation.tree'] = {
  tags: ['environment_sanitation', 'tree'],
  params: basicReport,
};
SO['environment_sanitation.tree.down'] = SO['environment_sanitation.tree'];
SO['environment_sanitation.tree.down'].tags = [...SO['environment_sanitation.tree'].tags, 'down'];
SO['environment_sanitation.tree.inspection'] = SO['environment_sanitation.tree'];
SO['environment_sanitation.tree.inspection'].tags = [...SO['environment_sanitation.tree'].tags, 'inspection'];
SO['environment_sanitation.tree.planting'] = SO['environment_sanitation.tree'];
SO['environment_sanitation.tree.planting'].tags = [...SO['environment_sanitation.tree'].tags, 'planting'];
SO['environment_sanitation.tree.pruning'] = SO['environment_sanitation.tree'];
SO['environment_sanitation.tree.pruning'].tags = [...SO['environment_sanitation.tree'].tags, 'pruning'];
SO['environment_sanitation.tree.removal'] = SO['environment_sanitation.tree'];
SO['environment_sanitation.tree.removal'].tags = [...SO['environment_sanitation.tree'].tags, 'removal'];

SO['environment_sanitation.trash.animal'] = {
  tags: ['environment_sanitation', 'trash', 'animal'],
  params: basicReport,
};
SO['environment_sanitation.collection_missed'] = {
  tags: ['environment_sanitation', 'collection_missed'],
  params: basicReport,
};
SO['environment_sanitation.collection_missed.trash'] = SO['environment_sanitation.collection_missed'];
SO['environment_sanitation.collection_missed.trash'].tags = [...SO['environment_sanitation.collection_missed'].tags, 'trash'];
SO['environment_sanitation.collection_missed.recycling'] = SO['environment_sanitation.collection_missed'];
SO['environment_sanitation.collection_missed.recycling'].tags = [...SO['environment_sanitation.collection_missed'].tags, 'recycling'];
SO['environment_sanitation.litter'] = {
  tags: ['environment_sanitation', 'litter'],
  params: basicReport,
};
SO['environment_sanitation.air.quality'] = {
  tags: ['environment_sanitation', 'air', 'quality'],
  params: basicReport,
};
SO['environment_sanitation.water.flood'] = {
  tags: ['environment_sanitation', 'water', 'flood'],
  params: basicReport,
};
SO['environment_sanitation.water.quality'] = {
  tags: ['environment_sanitation', 'water', 'quality'],
  params: basicReport,
};
SO['environment_sanitation.catch_basin.repairs'] = {
  tags: ['environment_sanitation', 'catch_basin', 'repairs'],
  params: basicReport,
};
SO['environment_sanitation.catch_basin.cleaning'] = {
  tags: ['environment_sanitation', 'catch_basin', 'cleaning'],
  params: basicReport,
};
SO['environment_sanitation.catch_basin.request'] = {
  tags: ['environment_sanitation', 'catch_basin', 'request'],
  params: basicReport,
};
SO['environment_sanitation.catch_basin.adopt'] = {
  tags: ['environment_sanitation', 'catch_basin', 'adopt'],
  params: basicReport,
};

SO['environment_sanitation.dumping'] = {
  tags: ['environment_sanitation', 'dumping'],
  params: {
    location,
    attachments: image,
    hazardous,
  },
};

// Health
SO['health_medicine.report'] = {
  tags: ['health_medicine'],
  params: basicReport,
};
SO['health_medicine.unsanitary.business'] = {
  tags: ['health_medicine', 'unsanitary', 'business'],
  params: basicReport,
};
SO['health_medicine.unsanitary.food_truck'] = {
  tags: ['health_medicine', 'unsanitary', 'food_truck'],
  params: basicReport,
};
SO['health_medicine.unsanitary.housing'] = {
  tags: ['health_medicine', 'unsanitary', 'housing'],
  params: basicReport,
};
SO['health_medicine.unsanitary.resturaunt'] = {
  tags: ['health_medicine', 'unsanitary', 'resturaunt'],
  params: basicReport,
};
SO['health_medicine.standing_water'] = {
  tags: ['health_medicine', 'standing_water'],
  params: basicReport,
};
SO['health_medicine.animal.rabbies'] = {
  tags: ['health_medicine', 'animal', 'rabbies'],
  params: basicNote,
};
SO['health_medicine.animal.dead'] = {
  tags: ['health_medicine', 'animal', 'dead'],
  params: basicNote,
};
SO['health_medicine.animal.excrement'] = {
  tags: ['health_medicine', 'animal', 'excrement'],
  params: basicNote,
};
SO['health_medicine.rodents'] = {
  tags: ['health_medicine', 'rodents'],
  params: locationReport,
};
SO['health_medicine.insects'] = {
  tags: ['health_medicine', 'insects'],
  params: locationReport,
};
SO['health_medicine.insects.bed_bugs'] = {
  tags: ['health_medicine', 'insects', 'bed_bugs'],
  params: locationReport,
};
SO['health_medicine.insects.bees'] = {
  tags: ['health_medicine', 'insects', 'bees'],
  params: locationReport,
};

// Property
SO['property_buildings_homes.accessibility.ramp'] = {
  tags: ['property_buildings_homes', 'accessibility', 'ramp'],
  params: basicReport,
};
SO['property_buildings_homes.accessibility.elevator.broken'] = {
  tags: ['property_buildings_homes', 'accessibility', 'elevator', 'broken'],
  params: basicReport,
};
SO['property_buildings_homes.accessibility.escalator.broken'] = {
  tags: ['property_buildings_homes', 'accessibility', 'escalator', 'broken'],
  params: basicReport,
};
SO['property_buildings_homes.violation.housing'] = {
  tags: ['property_buildings_homes', 'violation', 'housing'],
  params: followUpReport,
};
SO['property_buildings_homes.violation.housing.heat'] = SO['property_buildings_homes.violation.housing'];
SO['property_buildings_homes.violation.housing.heat'].tags = [...SO['property_buildings_homes.violation.housing'].tags, 'heat'];
SO['property_buildings_homes.violation.housing.hot_water'] = SO['property_buildings_homes.violation.housing'];
SO['property_buildings_homes.violation.housing.hot_water'].tags = [...SO['property_buildings_homes.violation.housing'].tags, 'hot_water'];
SO['property_buildings_homes.violation.housing.repairs'] = SO['property_buildings_homes.violation.housing'];
SO['property_buildings_homes.violation.housing.repairs'].tags = [...SO['property_buildings_homes.violation.housing'].tags, 'repairs'];
SO['property_buildings_homes.violation.housing.repairs.public'] = SO['property_buildings_homes.violation.housing.repairs'];
SO['property_buildings_homes.violation.housing.repairs.public'].tags = [...SO['property_buildings_homes.violation.housing'].tags, 'repairs', 'public'];
SO['property_buildings_homes.violation.housing.repairs.public'].params.public_property = { value: true };
SO['property_buildings_homes.violation.housing.tree_damage'] = SO['property_buildings_homes.violation.housing'];
SO['property_buildings_homes.violation.housing.tree_damage'].tags = [...SO['property_buildings_homes.violation.housing'].tags, 'tree_damage'];
SO['property_buildings_homes.violation.housing.illegal_apartments'] = SO['property_buildings_homes.violation.housing'];
SO['property_buildings_homes.violation.housing.illegal_apartments'].tags = [...SO['property_buildings_homes.violation.housing'].tags, 'illegal_apartments'];
SO['property_buildings_homes.contested.housing.landlord'] = {
  tags: ['property_buildings_homes', 'contested', 'housing', 'landlord'],
  params: followUpReport,
};
SO['property_buildings_homes.contested.housing.tenant'] = {
  tags: ['property_buildings_homes', 'contested', 'housing', 'landlord'],
  params: followUpReport,
};
SO['property_buildings_homes.contested.housing.lease'] = {
  tags: ['property_buildings_homes', 'contested', 'housing', 'landlord'],
  params: followUpReport,
};
SO['property_buildings_homes.tenant.report'] = {
  tags: ['property_buildings_homes', 'tenant'],
  params: followUpReport,
};
SO['property_buildings_homes.sewage.backup'] = {
  tags: ['property_buildings_homes', 'sewage', 'backup'],
  params: followUpReport,
};
SO['property_buildings_homes.water.pressure'] = {
  tags: ['property_buildings_homes', 'water', 'pressure'],
  params: followUpReport,
};
SO['property_buildings_homes.water.drainage'] = {
  tags: ['property_buildings_homes', 'water', 'drainage'],
  params: followUpReport,
};
SO['property_buildings_homes.water.quality'] = {
  tags: ['property_buildings_homes', 'water', 'quality'],
  params: followUpReport,
};
SO['property_buildings_homes.water.leak'] = {
  tags: ['property_buildings_homes', 'water', 'leak'],
  params: followUpReport,
};
SO['property_buildings_homes.water.main_break'] = {
  tags: ['property_buildings_homes', 'water', 'main_break'],
  params: followUpReport,
};

SO['property_buildings_homes.construction'] = {
  tags: ['property_buildings_homes', 'construction'],
  params: locationReport,
};
SO['property_buildings_homes.construction.noise'] = SO['property_buildings_homes.construction'];
SO['property_buildings_homes.construction.off_hours'] = SO['property_buildings_homes.construction'];
SO['property_buildings_homes.construction.no_permit'] = SO['property_buildings_homes.construction'];
SO['property_buildings_homes.construction.safety'] = SO['property_buildings_homes.construction'];

SO['property_buildings_homes.graffiti'] = {
  tags: ['property_buildings_homes', 'graffiti'],
  params: {
    location,
    attachments: image,
    offensive,
    notes,
  },
};
SO['property_buildings_homes.over_growth'] = {
  tags: ['property_buildings_homes', 'over_growth'],
  params: {
    location,
    attachments: image,
    vacant_lot,
    notes,
  },
};
SO['property_buildings_homes.blight'] = {
  tags: ['property_buildings_homes', 'blight'],
  params: {
    location,
    attachments: image,
    vacant_lot,
    notes,
  },
};
SO['property_buildings_homes.odor'] = {
  tags: ['property_buildings_homes', 'odor'],
  params: locationReport,
};
SO['property_buildings_homes.odor.gas'] = {
  tags: ['property_buildings_homes', 'odor', 'gas'],
  params: {
    ...followUpReport,
  },
};
SO['property_buildings_homes.mold'] = {
  tags: ['property_buildings_homes', 'mold'],
  params: basicReport,
};
SO['property_buildings_homes.fire_hazard'] = {
  tags: ['property_buildings_homes', 'fire_hazard'],
  params: basicReport,
};
SO['property_buildings_homes.noise'] = {
  tags: ['property_buildings_homes', 'noise'],
  params: locationReport,
};
SO['property_buildings_homes.noise.neighbor'] = {
  tags: ['property_buildings_homes', 'noise', 'neighbor'],
  params: locationReport,
};
SO['property_buildings_homes.noise.alarm'] = {
  tags: ['property_buildings_homes', 'noise', 'alarm'],
  params: locationReport,
};
SO['property_buildings_homes.squatting'] = {
  tags: ['property_buildings_homes', 'squatting'],
  params: locationReport,
};
SO['property_buildings_homes.water_meter'] = {
  tags: ['property_buildings_homes', 'water_meter'],
  params: locationReport,
};

// Public Safety
SO['public_safety_law.harassment'] = {
  tags: ['public_safety_law', 'harassment'],
  params: followUpReport,
};
SO['public_safety_law.hate_crime'] = {
  tags: ['public_safety_law', 'hate_crime'],
  params: basicReport,
};
SO['public_safety_law.missing_person'] = {
  tags: ['public_safety_law', 'missing_person'],
  params: followUpReport,
};
SO['public_safety_law.activity'] = {
  tags: ['public_safety_law', 'activity'],
  params: basicReport,
};
SO['public_safety_law.activity.drug'] = {
  tags: ['public_safety_law', 'activity', 'drug'],
  params: basicReport,
};
SO['public_safety_law.activity.suspicious'] = {
  tags: ['public_safety_law', 'activity', 'suspicious'],
  params: basicReport,
};
SO['public_safety_law.bribery'] = {
  tags: ['public_safety_law', 'bribery'],
  params: basicReport,
};

// Transportation
SO['transportation_streets_sidewalks.highway.adopt'] = {
  tags: ['transportation_streets_sidewalks', 'highway', 'adopt'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.street'] = {
  tags: ['transportation_streets_sidewalks', 'street'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.street.pothole'] = {
  tags: ['transportation_streets_sidewalks', 'street', 'pothole'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.street.manhole'] = {
  tags: ['transportation_streets_sidewalks', 'street', 'manhole'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.street.fire_hydrant'] = {
  tags: ['transportation_streets_sidewalks', 'street', 'fire_hydrant'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.street.blocking'] = {
  tags: ['transportation_streets_sidewalks', 'street', 'blocking'],
  params: basicReport,
};

SO['transportation_streets_sidewalks.driveway'] = {
  tags: ['transportation_streets_sidewalks', 'driveway'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.road_markings'] = {
  tags: ['transportation_streets_sidewalks', 'driveway'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.sidewalk'] = {
  tags: ['transportation_streets_sidewalks', 'sidewalk'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.sidewalk.safety'] = {
  tags: ['transportation_streets_sidewalks', 'sidewalk', 'safety'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.curb'] = {
  tags: ['transportation_streets_sidewalks', 'curb'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.curb.ramp'] = {
  tags: ['transportation_streets_sidewalks', 'curb', 'ramp'],
  params: basicReport,
};

SO['transportation_streets_sidewalks.sign'] = {
  tags: ['transportation_streets_sidewalks', 'sign'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.sign.missing'] = {
  tags: ['transportation_streets_sidewalks', 'sign', 'missing'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.sign.broken'] = {
  tags: ['transportation_streets_sidewalks', 'sign', 'broken'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.sign.conflict'] = {
  tags: ['transportation_streets_sidewalks', 'sign', 'conflict'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.sign.down'] = {
  tags: ['transportation_streets_sidewalks', 'sign', 'down'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.sign.request'] = {
  tags: ['transportation_streets_sidewalks', 'sign', 'request'],
  params: basicReport,
};

SO['transportation_streets_sidewalks.signal'] = {
  tags: ['transportation_streets_sidewalks', 'signal'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.signal.always_on'] = {
  tags: ['transportation_streets_sidewalks', 'signal', 'always_on'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.signal.burnt_out'] = {
  tags: ['transportation_streets_sidewalks', 'signal', 'burnt_out'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.signal.flickering'] = {
  tags: ['transportation_streets_sidewalks', 'signal', 'flickering'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.signal.down'] = {
  tags: ['transportation_streets_sidewalks', 'signal', 'down'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.signal.request'] = {
  tags: ['transportation_streets_sidewalks', 'signal', 'request'],
  params: basicReport,
};

SO['transportation_streets_sidewalks.street_light'] = {
  tags: ['transportation_streets_sidewalks', 'street_light'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.street_light.always_on'] = {
  tags: ['transportation_streets_sidewalks', 'street_light', 'always_on'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.street_light.burnt_out'] = {
  tags: ['transportation_streets_sidewalks', 'street_light', 'burnt_out'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.street_light.flickering'] = {
  tags: ['transportation_streets_sidewalks', 'street_light', 'flickering'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.street_light.down'] = {
  tags: ['transportation_streets_sidewalks', 'street_light', 'down'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.street_light.request'] = {
  tags: ['transportation_streets_sidewalks', 'street_light', 'request'],
  params: basicReport,
};

SO['transportation_streets_sidewalks.violation.parking'] = {
  tags: ['transportation_streets_sidewalks', 'violation', 'parking'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.violation.parking.blocking'] = {
  tags: ['transportation_streets_sidewalks', 'violation', 'parking', 'blocking'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.violation.parking.bus_zone'] = {
  tags: ['transportation_streets_sidewalks', 'violation', 'parking', 'bus_zone'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.violation.parking.no_parking'] = {
  tags: ['transportation_streets_sidewalks', 'violation', 'parking', 'no_parking'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.violation.parking.emergency_zone'] = {
  tags: ['transportation_streets_sidewalks', 'violation', 'parking', 'emergency_zone'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.violation.parking.expired_tags'] = {
  tags: ['transportation_streets_sidewalks', 'violation', 'parking', 'expired_tags'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.violation.parking.fire_hydrant'] = {
  tags: ['transportation_streets_sidewalks', 'violation', 'parking', 'fire_hydrant'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.violation.parking.handicap'] = {
  tags: ['transportation_streets_sidewalks', 'violation', 'parking', 'handicap'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.violation.parking.loading_zone'] = {
  tags: ['transportation_streets_sidewalks', 'violation', 'parking', 'loading_zone'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.violation.parking.parking_meter'] = {
  tags: ['transportation_streets_sidewalks', 'violation', 'parking', 'parking_meter'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.violation.parking.school_zone'] = {
  tags: ['transportation_streets_sidewalks', 'violation', 'parking', 'school_zone'],
  params: basicReport,
};

SO['transportation_streets_sidewalks.parking_meter'] = {
  tags: ['transportation_streets_sidewalks', 'parking_meter'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.parking_meter.broken'] = {
  tags: ['transportation_streets_sidewalks', 'parking_meter', 'broken'],
  params: basicReport,
};

SO['transportation_streets_sidewalks.plowing'] = {
  tags: ['transportation_streets_sidewalks', 'plowing'],
  params: basicReport,
};

SO['transportation_streets_sidewalks.construction.noise'] = {
  tags: ['transportation_streets_sidewalks', 'construction', 'noise'],
  params: basicReport,
};

SO['transportation_streets_sidewalks.bicycle.racks'] = {
  tags: ['transportation_streets_sidewalks', 'bicycle', 'racks'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.bicycle.lanes'] = {
  tags: ['transportation_streets_sidewalks', 'bicycle', 'lanes'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.bicycle.lanes.blocking'] = {
  tags: ['transportation_streets_sidewalks', 'bicycle', 'lanes', 'blocking'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.bicycle.sharing'] = {
  tags: ['transportation_streets_sidewalks', 'bicycle', 'sharing'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.bicycle.abandoned'] = {
  tags: ['transportation_streets_sidewalks', 'bicycle', 'abandoned'],
  params: basicReport,
  // private property
};
SO['transportation_streets_sidewalks.vehicle.idling'] = {
  tags: ['transportation_streets_sidewalks', 'vehicle', 'idling'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.vehicle.wreckless'] = {
  tags: ['transportation_streets_sidewalks', 'vehicle', 'wreckless'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.vehicle.abandoned'] = {
  tags: ['transportation_streets_sidewalks', 'vehicle', 'abandoned'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.wire.down'] = {
  tags: ['transportation_streets_sidewalks', 'wire', 'down'],
  params: basicReport,
};
SO['transportation_streets_sidewalks.wire.safety'] = {
  tags: ['transportation_streets_sidewalks', 'wire', 'safety'],
  params: basicReport,
};

// Government, Civil Services
SO['government_civil_services.vehicle.misuse'] = {
  tags: ['transportation_streets_sidewalks', 'vehicle', 'misuse'],
  params: basicReport,
};

// General
SO['government_civil_services.suggestion'] = {
  tags: ['general', 'suggestion'],
  params: {
    notes: { ...notes, instruction: 'What\'s your idea?' },
    location,
    attachments: image,
  },
};


// Compile!
const readySO = {};
Object.keys(SO).forEach((key) => {
  if (Object.keys(SO[key]).length > 0) {
    readySO[key] = SO[key];
    if (!readySO[key].params.notes) readySO[key].params.notes = notes;
  }
});
const ShoutOuts = {
  all: SO,
  ready: readySO,
};

export default ShoutOuts;
