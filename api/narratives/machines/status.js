import { getIntegrationConfig } from '../../integrations/helpers';
import * as VEHICLE_CONST from '../../constants/vehicles';
import * as INTEGRATION_CONST from '../../constants/integrations';
import StaeClient from '../clients/stae-client';
import KitClient from '../clients/kit-client';
import { fetchAnswers } from '../helpers';
import { lookupActiveVehicles } from '../../vehicles/helpers';
import * as replyTemplates from '../templates/quick-replies';

export default {
  async plowing() {
    let message = 'Salting and plowing beginas before the storm hits starting with roads used by emergency vehicles.';
    const vehicleStatusObj = await lookupActiveVehicles(VEHICLE_CONST.SNOW_REMOVAL,
      this.snapshot.organization_id).then(v => v);
    if (vehicleStatusObj.vehicles.length > 0) {
      message += ` Municipal Vehicles Active: ${vehicleStatusObj.vehicles.length}`;
    }
    this.messagingClient.send(message);
    return this.getBaseState();
  },
  async bicycle_share_availability() {
    // Check for Stae integration. If we have it, run, otherwise run basic answer
    const staeConfig = await getIntegrationConfig(this.snapshot.organization_id, INTEGRATION_CONST.STAE).then(c => c);
    if (staeConfig) {
      // Check for user location, and ask for it if we don't have it
      if (!this.get('attributes') || (this.get('attributes') && !this.get('attributes').current_location)) {
        this.messagingClient.send('Where are you currently located?', [replyTemplates.location, replyTemplates.exit]);
        return this.requestClosestLocation();
      }
      // Get closest bike stations
      const bikeStations = await new StaeClient(staeConfig).getBikeShareStations({
        sortFromPoint: [this.get('attributes').current_location.lat, this.get('attributes').current_location.lon],
      }).then(bs => bs);
      if (bikeStations.length > 0) {
        this.messagingClient.addToQuene('Here are the closest bike stations to you.')
        this.messagingClient.addAll(KitClient.genericTemplateFromEntities(bikeStations), replyTemplates.evalHelpfulAnswer);
      } else {
        this.messagingClient.addToQuene('I didn\'t find any bike share stations near you.');
      }
      // Clear current location if it was in use
      this.clearCurrentLocation();
      return this.messagingClient.runQuene().then(() => this.getBaseState());
    }
    // Otherwise return normal answer
    return fetchAnswers(this.snapshot.nlp.entities.intent[0].value, this);
  },
};
