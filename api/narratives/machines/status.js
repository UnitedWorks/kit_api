import { lookupActiveVehicles } from '../../knowledge-base/helpers';
import * as VEHICLE_CONST from '../../constants/vehicles';

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
};
