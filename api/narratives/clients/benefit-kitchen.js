import axios from 'axios';
import { logger } from '../../logger';


export default class BenefitKitchen {
  constructor() {}

  getInternetEligibility(t) {
    let monthly_income = t.monthly_income;
    let family_size = t.family_size;
    let k = t.fpl  || (980 + 347 * (family_size - 1));
    let welfare_amount = t.welfare_amount;
    let food_stamps = t.food_stamps;
    let school_lunch = t.school_lunch;
    let lifeline = t.lifeline;
    let zip = t.live_zip;
    var qualify = [];

    if (monthly_income < 3 * k) { qualify.push("lowincome"); }
    if (welfare_amount > 0) { qualify.push("tanf"); }
    if (food_stamps > 0) { qualify.push("nutritionassistance"); }
    if (school_lunch === "yes") { qualify.push("freelunch"); }
    if (lifeline === 9.25) { qualify.push("lifeline") }

    var q = qualify.join(',');

    var url = `https://api.everyoneon.org/offer-locater.php?code=tRL8H4Tr967QdR9V&zip=${zip}&partner=benefitkitchen&type=internet&qualify=${q}`;
    logger.info(url);

    /* TODO(nicksahler) Not this */
    return axios.get(url);
  };
};
