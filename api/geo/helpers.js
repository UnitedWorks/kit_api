import { bookshelf, knex } from '../orm';
import { Address } from './models';
import geocoder from '../utils/geocoder';

export function addressToString(address) {
  return `${address.address_1}, ${address.city}${address.region ? `, ${address.region} ` : ' '}${address.state} ${address.country}`;
}

export async function getCoordinatesForAddress(address) {
  if (!address) return null;
  const addressObj = address.address ? address.address : address;
  // Grab LAT/LON for this address and attach
  const geocoded = await geocoder(addressToString(addressObj)).then(g => g);
  return {
    ...address,
    location: geocoded.lat && geocoded.lon ? [geocoded.lat, geocoded.lon] : null,
  };
}

export async function getGeomPointTextForAddress(address) {
  const coords = !address.lat || !address.lon
    ? await getCoordinatesForAddress(address).location
    : [address.lat, address.lon];
  return `ST_PointFromText('POINT'${coords[0]}, ${coords[1]},4326)`;
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
      if (address.id) {
        Address.where({ id: address.id }).save({
          ...address,
          location: bookshelf.knex.raw(getGeomPointTextForAddress(address)),
        }, { method: 'update', patch: true }).then(a => a.id);
      } else {
        Address.forge({
          ...address,
          location: bookshelf.knex.raw(getGeomPointTextForAddress(address)),
        }).save(null, { method: 'insert' }).then(p => p.id);
      }
    })).then(ids => ids.filter(i => i));
    // Create relations between phones/entities
    knex('addresss_entity_associations').where(relation).del()
      .then(() => knex.batchInsert('addresss_entity_associations', newAddressIds.map(aId => ({ address_id: aId, ...relation }))).then(r => r));
  }
}

export async function createAddress(address, options = { returnJSON: true }) {
  // If already geocoded, just forge (should have formatting + coordinates from geocoder)
  if (address.location || address.address) {
    return await Address.forge(address).save(null, { method: 'insert' })
      .then(data => (options.returnJSON ? data.toJSON() : data));
  // Otherwise, run geocode and format/forge
  }
  let geocodedObj = null;
  // If given a string
  if (typeof address === 'string') {
    geocodedObj = await geocoder(address).then(g => g);
  // If given an address object
  } else if (address.address) {
    geocodedObj = await geocoder(addressToString(address.address)).then(g => g);
  } else if (address.lat && address.lon) {
    geocodedObj = await geocoder(`${address.lat}, ${address.lon}`).then(g => g);
  }
  return Address.forge({
    ...address,
    location: geocodedObj ? bookshelf.knex.raw(getGeomPointTextForAddress(geocodedObj)) : null,
  }).save(null, { method: 'insert' })
  .then(add => (options.returnJSON ? add.toJSON() : add));
}
