// Entity Types
export const PLACE = 'place';
export const EVENT = 'event';
export const SERVICE = 'service';
export const PERSON = 'person';
export const ANSWER = 'answer';
export const ENTITIES = [PLACE, EVENT, SERVICE, ANSWER, PERSON];

// FAQ Categories
export const TRANSPORTATION_CATEGORY = 'Transportation, Streets, and Sidewalks';
export const ENVIRONMENT_CATEGORY = 'Environment and Sanitation';
export const PROPERTY_CATEGORY = 'Property, Buildings, and Homes';
export const EDUCATION_CATEGORY = 'Education and Employment';
export const BUSINESS_CATEGORY = 'Business and Finance';
export const SOCIAL_SERVICES_CATEGORY = 'Social Services';
export const HEALTH_CATEGORY = 'Health and Medicine';
export const PUBLIC_SAFETY_CATEGORY = 'Public Safety and Law';
export const GOVERNMENT_CATEGORY = 'Government and Civil Services';
export const GENERAL_CATEGORY = 'General';
export const GENERAL_CATEGORY_LABEL = 'general';
export const CATEGORIES = [TRANSPORTATION_CATEGORY, ENVIRONMENT_CATEGORY, PROPERTY_CATEGORY,
  EDUCATION_CATEGORY, BUSINESS_CATEGORY, SOCIAL_SERVICES_CATEGORY, HEALTH_CATEGORY,
  PUBLIC_SAFETY_CATEGORY, GOVERNMENT_CATEGORY, GENERAL_CATEGORY];

// Media Types
export const IMAGE = 'image';
export const AUDIO = 'audio';
export const VIDEO = 'video';
export const FILE = 'file';

export const MEDIA_TYPES = [IMAGE, AUDIO, VIDEO, FILE];


// Entity Types (think it makes sense only for places to have these?)
// From Open311
export const AFTER_SCHOOL = 'After School Program';
export const BEACH = 'Beach';
export const BUSINESS_SOLUTION_CENTER = 'Business Solution Center';
export const CHILD_CARE = 'Child Care Center';
export const CLINIC = 'Clinic';
export const CULTURAL_INSTITUTION = 'Cultural Institution';
export const TAX_ASSISTANCE = 'EITC Assistance Center';
export const FINANCIAL_EDUCATION = 'Financial Education Site';
export const FOOD_PROVIDER = 'Food Provider';
export const FOOD_STAMP_CENTER = 'Food Stamp Center';
export const MARKET = 'Market';
export const HOSPITAL = 'Hospital';
export const IMMIGRATION_SERVICES = 'Immigrant Service Provider';
export const JAIL_RELEASE_SERVICES = 'Jail Release Services';
export const LIBRARY = 'Library';
export const MEDICAID = 'Medicaid Office';
export const MEDICARE = 'Medicare Drug Counseling';
export const NON_PROFIT = 'Non-Profit Organization';
export const PARK = 'Park';
export const POOL = 'Pool';
export const PRECINCT = 'Precinct';
export const REC_CENTER = 'Recreation Center';
export const SCHOOL = 'School';
export const SCHOOL_DISTRICT = 'School District';
export const SUMMER_MEAL_PROGRAM = 'Summer Meal Program';
export const PRE_K = 'Universal Pre-K';
export const WORKFORCE_CENTER = 'Workforce Career Center';
export const YOUTH_EMPLOYMENT = 'Youth Employment';
// My addons
export const EMERGENCY_SHELTER = 'Emergency Shelter';
export const HOMELESS_SHELTER = 'Homeless Shelter';
export const WARMING_CENTER = 'Warming Center';

export const FACILITY_FUNCTIONS = [AFTER_SCHOOL, BEACH,
  BUSINESS_SOLUTION_CENTER, CHILD_CARE, CLINIC,
  CULTURAL_INSTITUTION, TAX_ASSISTANCE, FINANCIAL_EDUCATION, FOOD_PROVIDER,
  FOOD_STAMP_CENTER, MARKET, HOSPITAL, IMMIGRATION_SERVICES,
  JAIL_RELEASE_SERVICES, LIBRARY, MEDICAID, MEDICARE, NON_PROFIT, PARK, POOL,
  PRECINCT, REC_CENTER, SCHOOL, SCHOOL_DISTRICT, SUMMER_MEAL_PROGRAM, PRE_K,
  WORKFORCE_CENTER, YOUTH_EMPLOYMENT,
  EMERGENCY_SHELTER, HOMELESS_SHELTER, WARMING_CENTER];

// Services (Picked them from Healthify Category)
export const COMMUNITY = 'Community';
export const EDUCATION = 'Education';
export const EMERGENCY = 'Emergency';
export const FAMILY = 'Family';
export const FINANCIAL_SUPPORT = 'Financial Support';
export const FOOD = 'Food';
export const GOODS = 'Goods';
export const HEALTH = 'Health';
export const HOUSING = 'Housing';
export const LEGAL = 'Legal';
export const MENTAL_HEALTH = 'Mental Health';
export const TRANSPORTATION = 'Transportation';
export const WORK = 'Work';

export const SERVICE_FUNCTIONS = [COMMUNITY, EDUCATION, EMERGENCY, FAMILY,
  FINANCIAL_SUPPORT, FOOD, GOODS, HEALTH, HOUSING, LEGAL, MENTAL_HEALTH,
  TRANSPORTATION, WORK];
