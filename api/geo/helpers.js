import { bookshelf, knex } from '../orm';
import { Address } from './models';
import { geocoder } from '../utils/geocoder';

export function getMapsViewUrl({ coordinates, string }) {
  if (coordinates && !string) {
    return `https://www.google.com/maps?q=${coordinates[0]},${coordinates[1]}`;
  } else if (!coordinates && string) {
    const formattedString = string.replace(/\s/, '+');
    return `https://www.google.com/maps/place/${formattedString}`;
  } else if (coordinates && string) {
    const formattedString = string.replace(/\s/, '+');
    return `https://www.google.com/maps/place/${formattedString}/@${coordinates[0]},${coordinates[1]},15z`;
  }
  return null;
}

export function getStaticMapsImageUrl(lat, lon, zoom = 16) {
  // 570x300 is a 1.9:1 ratio FB requires
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v10/static/pin-s+3C3EFF(${lon},${lat})/${lon},${lat},${zoom}/570x300@2x?access_token=${process.env.MAPBOX_API_TOKEN}`;
}

export function getStaticMapsPolyImageUrl(geoJSON, lat, lon, zoom = 16) {
  // 570x300 is a 1.9:1 ratio FB requires
  return `http://maps.googleapis.com/maps/api/staticmap?size=570x300&sensor=false&path=color:0x3C3EFF40|weight:3|fillcolor:0x3C3EFF40|${geoJSON.coordinates[0].map(c => `${c[0]},${c[1]}`).join('|')}`;
}

export function addressToString(address, options = { slim: true }) {
  if (!address) return null;
  if (typeof address === 'string') return address;
  return `${address.address_1 ? `${address.address_1}, ` : ''}${address.city || ''}${address.region && !options.slim ? `, ${address.region} ` : ' '} ${address.state && !options.slim ? address.state || '' : ''} ${address.country && !options.slim ? address.country || '' : ''}`;
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
