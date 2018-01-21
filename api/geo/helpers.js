import { bookshelf, knex } from '../orm';
import { Address } from './models';
import geocoder from '../utils/geocoder';

export function getMapsViewUrl(payload, type = 'name') {
  if (type === 'coordinates' && payload.length) {
    return `https://www.google.com/maps?q=${payload[0]},${payload[1]}`;
  }
  const formattedString = payload.replace(/\s/, '+');
  return `https://www.google.com/maps/place/${formattedString}`;
}

export function getStaticMapsImageUrl(lat, lon) {
  // 570x300 is a 1.9:1 ratio FB requires
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=17&size=570x300&scale=2&markers=color:0x3C3EFF%7C${lat},${lon}&7Csize:tiny&key=${process.env.GOOGLE_MAPS_API_KEY}`;
}

export function addressToString(address, options = { slim: true }) {
  if (!address) return null;
  if (typeof address === 'string') return address;
  return `${address.address_1}, ${address.city || ''}${address.region && !options.slim ? `, ${address.region} ` : ' '} ${address.state && !options.slim ? address.state || '' : ''} ${address.country && !options.slim ? address.country || '' : ''}`;
}

export function getCoordinatesFromAddress(address) {
  if (!address) return null;
  if (address.location) {
    return address.location.coordinates;
  }
  return null;
}

export function getGeomPointTextForAddress(address) {
  if (address.location && address.location.coordinates) {
    return `ST_PointFromText('POINT(${address.location.coordinates[0]} ${address.location.coordinates[1]})',4326)`;
  }
  return null;
}

export async function crudEntityAddresses(relation, addresses) {
  // A relation needs to exist
  if (!relation) return;
  const existingAddressIds = await knex.select('address_id').from('addresss_entity_associations').where(relation).then(ids => ids);
  // If no addresses exist, delete on the relation
  if (!addresses || (addresses.length === 0)) {
    // Remove Relations
    await knex('addresss_entity_associations').where(relation).del().then(d => d);
    // Remove Addresses by ID
    Promise.all((existingAddressIds || []).map(id => knex('addresss').where({ id }).del())).then(r => r);
  } else {
    // Create/Update All Addresses, Returning IDs (Delete if no numbers exist)
    const newAddressIds = await Promise.all(addresses.map((address) => {
      const pointText = getGeomPointTextForAddress(address);
      if (pointText) {
        return Address.where({ id: address.id }).save({
          ...address,
          location: bookshelf.knex.raw(pointText),
        }, { method: 'update', patch: true }).then(a => a.id);
      }
      return geocoder(addressToString(address)).then((newAddress) => {
        return Address.forge({
          ...newAddress,
          location: bookshelf.knex.raw(getGeomPointTextForAddress(newAddress)),
        }).save(null, { method: 'insert' }).then(p => p.id);
      });
    })).then(ids => ids.filter(i => i));
    // Create relations between phones/entities
    knex('addresss_entity_associations').where(relation).del()
      .then(() => knex.batchInsert('addresss_entity_associations', newAddressIds.map(aId => ({ address_id: aId, ...relation }))).then(r => r));
  }
}

export async function createAddress(address, options = { returnJSON: true }) {
  if (!address) return null;
  // Was this address geocoded already?
  const pointText = getGeomPointTextForAddress(address);
  if (pointText) {
    return Address.forge({
      ...address,
      location: bookshelf.knex.raw(pointText),
    }).save().then(a => (options.returnJSON ? a.toJSON() : a));
  }
  // If not, geocode!
  return geocoder(typeof address === 'string' ? address : addressToString(address))
    .then(newAddress => Address.forge({
      ...newAddress,
      location: bookshelf.knex.raw(getGeomPointTextForAddress(newAddress)),
    }).save().then(a => (options.returnJSON ? a.toJSON() : a)));
}
